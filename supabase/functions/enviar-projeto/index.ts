// index.ts — Edge Function "enviar-projeto"
//
// Ordem das defesas (cada uma só roda se a anterior passou):
//   1. origem permitida (CORS)  →  2. método e tipo do conteúdo
//   3. rate limit por IP (no banco)  →  4. corpo com tamanho máximo
//   5. anti-robô (honeypot + tempo)  →  6. validação estrita (Zod)
//   7. imagem: valida, reconstrói e guarda no Storage (nome aleatório gerado AQUI)
//   8. gravação atômica (função SQL; status fixo "pendente")  →  9. e-mail aos admins e ao aluno
//   Se algo falhar depois do passo 7, a imagem é apagada (nada de lixo no Storage).

import { createClient } from "@supabase/supabase-js";
import { CorpoSchema, formatarErros } from "./validacao.ts";
import { hmacHex, obterIp } from "./utils.ts";
import { notificarAdmins } from "./email.ts";
import { ErroImagem, processarImagem } from "./imagem.ts";
import { MAX_BASE64 } from "./jpegSeguro.ts";

const BUCKET = "projetos";
// O texto do formulário cabe em poucos KB; o resto do limite é para a imagem em base64.
const MAX_CORPO_BYTES = MAX_BASE64 + 64 * 1024;
const TEMPO_MINIMO_MS = 3000; // um humano não preenche o formulário em menos de 3 s

// Segredos e configurações vêm do ambiente (Supabase → Edge Functions → Secrets).
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são fornecidas pelo próprio Supabase.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const IP_HASH_SECRET = Deno.env.get("IP_HASH_SECRET");
const ORIGENS_PERMITIDAS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Cliente com a chave de serviço: só existe AQUI, dentro do Supabase. Nunca vai ao navegador.
const supabase =
  SUPABASE_URL && SERVICE_ROLE
    ? createClient(SUPABASE_URL, SERVICE_ROLE, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

class ErroHttp extends Error {
  constructor(public status: number, public codigo: string, public mensagem: string) {
    super(codigo);
  }
}

function montarCabecalhos(origem: string | null): Record<string, string> {
  const cabecalhos: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
  if (origem && ORIGENS_PERMITIDAS.includes(origem)) {
    cabecalhos["Access-Control-Allow-Origin"] = origem;
    cabecalhos["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    cabecalhos["Access-Control-Allow-Headers"] = "content-type, authorization, apikey, x-client-info";
    cabecalhos["Access-Control-Max-Age"] = "600";
  }
  return cabecalhos;
}

/** Lê o corpo contando os bytes: não confia no cabeçalho Content-Length (que pode mentir). */
async function lerCorpoLimitado(req: Request, maximo: number): Promise<unknown> {
  const declarado = Number(req.headers.get("content-length") ?? "0");
  if (declarado > maximo) {
    throw new ErroHttp(413, "CORPO_GRANDE", "O envio é grande demais.");
  }

  const leitor = req.body?.getReader();
  if (!leitor) throw new ErroHttp(400, "CORPO_AUSENTE", "Envio vazio.");

  const partes: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximo) {
      await leitor.cancel();
      throw new ErroHttp(413, "CORPO_GRANDE", "O envio é grande demais.");
    }
    partes.push(value);
  }

  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const parte of partes) {
    bytes.set(parte, posicao);
    posicao += parte.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new ErroHttp(400, "JSON_INVALIDO", "Não foi possível ler o envio.");
  }
}

/** Honeypot preenchido ou formulário "rápido demais" → provavelmente um robô. */
function pareceRobo(corpo: unknown): boolean {
  if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) return false;
  const c = corpo as Record<string, unknown>;
  if (typeof c.hp === "string" && c.hp.trim() !== "") return true;
  return typeof c.tempo_ms !== "number" || c.tempo_ms < TEMPO_MINIMO_MS;
}

/** Registra só o que é seguro: o código do erro e as nossas mensagens-código. Nunca dados do usuário. */
function registrarErro(contexto: string, erro: unknown): void {
  const e = erro as { code?: string; message?: string; name?: string } | null;
  const mensagemSegura = e?.message && /^[A-Z_0-9]+$/.test(e.message) ? e.message : undefined;
  console.error(contexto, { codigo: e?.code, mensagem: mensagemSegura, tipo: e?.name });
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origem = req.headers.get("origin");
  const cabecalhos = montarCabecalhos(origem);
  const responder = (status: number, corpo: Record<string, unknown>, extras: Record<string, string> = {}) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cabecalhos, ...extras } });

  // 1) Origem: um navegador em outro site não pode usar este endpoint.
  //    (Ferramentas como curl não enviam "Origin"; por isso esta NÃO é a defesa principal.)
  if (origem && !ORIGENS_PERMITIDAS.includes(origem)) {
    return responder(403, { ok: false, codigo: "ORIGEM_NAO_PERMITIDA", mensagem: "Origem não permitida." });
  }

  // 2) Método e tipo de conteúdo
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cabecalhos });
  if (req.method !== "POST") {
    return responder(405, { ok: false, codigo: "METODO_INVALIDO", mensagem: "Método não permitido." }, { Allow: "POST, OPTIONS" });
  }
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return responder(415, { ok: false, codigo: "TIPO_INVALIDO", mensagem: "Envie os dados em JSON." });
  }
  if (!supabase || !IP_HASH_SECRET) {
    console.error("CONFIGURACAO_AUSENTE");
    return responder(500, { ok: false, codigo: "ERRO_INTERNO", mensagem: "Erro interno. Tente novamente mais tarde." });
  }

  // Controle da imagem: se o projeto não chegar a ser criado, a imagem guardada é apagada.
  let caminhoImagem: string | null = null;
  let projetoCriado = false;

  try {
    // 3) Rate limit: 7 por 15 min e 15 por dia, por IP. Guardamos o HASH do IP, nunca o IP.
    const ipHash = await hmacHex(IP_HASH_SECRET, obterIp(req));
    const { data: limite, error: erroLimite } = await supabase.rpc("checar_rate_limit", { p_chave: ipHash });
    if (erroLimite) throw erroLimite;
    if (!limite?.permitido) {
      const espera = Number(limite?.retry_apos_segundos ?? 60);
      return responder(
        429,
        {
          ok: false,
          codigo: "MUITAS_TENTATIVAS",
          mensagem: "Você fez muitas tentativas. Aguarde um pouco e tente novamente.",
          retry_apos_segundos: espera,
        },
        { "Retry-After": String(espera) },
      );
    }

    // 4) Corpo com tamanho máximo
    const bruto = await lerCorpoLimitado(req, MAX_CORPO_BYTES);

    // 5) Anti-robô: responde "sucesso" sem gravar nada, para não ensinar o robô a se adaptar.
    if (pareceRobo(bruto)) {
      console.warn("DESCARTADO_ANTIROBO");
      return responder(201, { ok: true });
    }

    // 6) Validação estrita (tipos, tamanhos, links, campos extras proibidos)
    const resultado = CorpoSchema.safeParse(bruto);
    if (!resultado.success) {
      return responder(422, {
        ok: false,
        codigo: "VALIDACAO",
        mensagem: "Confira os campos destacados.",
        erros: formatarErros(resultado.error),
      });
    }
    const { projeto, email_contato } = resultado.data;
    const imagem = (bruto as { imagem: string }).imagem;

    // 7) Imagem: valida a estrutura, RECONSTRÓI os pixels e só então guarda.
    //    O nome do arquivo é gerado aqui (UUID aleatório): o usuário não escolhe nada, e como o
    //    servidor nunca devolve esse endereço, ninguém consegue "adivinhar" a imagem de um pendente.
    let bytesImagem: Uint8Array;
    try {
      bytesImagem = processarImagem(imagem);
    } catch (erroImg) {
      if (erroImg instanceof ErroImagem) {
        return responder(422, {
          ok: false,
          codigo: "VALIDACAO",
          mensagem: "Confira os campos destacados.",
          erros: { imagem: erroImg.mensagem },
        });
      }
      throw erroImg;
    }

    const caminho = `${crypto.randomUUID()}.jpg`;
    const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, bytesImagem, {
      contentType: "image/jpeg",
      upsert: false, // nunca sobrescreve um arquivo existente
      cacheControl: "31536000",
    });
    if (erroUpload) throw erroUpload;
    caminhoImagem = caminho;
    const imagemUrl = supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;

    // 8) Gravação atômica. O status "pendente" está dentro da função SQL, não aqui.
    const { data: projetoId, error: erroBanco } = await supabase.rpc("criar_projeto_pendente", {
      p: { ...projeto, imagem_url: imagemUrl },
      p_email: email_contato,
      p_ip_hash: ipHash,
      p_user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    });

    if (erroBanco) {
      if (erroBanco.code === "23505") {
        return responder(409, {
          ok: false,
          codigo: "DUPLICADO",
          mensagem: "Já recebemos um projeto com este endereço.",
        });
      }
      switch (erroBanco.message) {
        case "TURMA_INVALIDA":
          return responder(422, { ok: false, codigo: "VALIDACAO", mensagem: "Confira os campos destacados.", erros: { turma: "Escolha uma turma da lista." } });
        case "TECNOLOGIA_INVALIDA":
          return responder(422, { ok: false, codigo: "VALIDACAO", mensagem: "Confira os campos destacados.", erros: { tecnologias: "Escolha as tecnologias apenas da lista." } });
        case "FILA_CHEIA":
          return responder(503, { ok: false, codigo: "FILA_CHEIA", mensagem: "Estamos com muitos envios em análise. Tente novamente em alguns dias." });
        default:
          throw erroBanco;
      }
    }

    projetoCriado = true; // a partir daqui a imagem pertence a um projeto e NÃO deve ser apagada

    // 9) Aviso aos admins (e confirmação ao aluno). O projeto JÁ está salvo: se o e-mail falhar, o envio continua válido.
    try {
      const resumoProjeto = {
        id: projetoId as number,
        titulo: projeto.titulo,
        turma: projeto.turma,
        tecnologias: projeto.tecnologias,
        totalIntegrantes: projeto.integrantes.length,
        site_url: projeto.site_url,
        repo_url: projeto.repo_url,
        imagem_url: imagemUrl,
        email_contato, // Passa também o e-mail do aluno que cadastrou o projeto
      } as Parameters<typeof notificarAdmins>[0] & { email_contato?: string };

      await notificarAdmins(resumoProjeto);
      await supabase
        .from("projeto_submissoes")
        .update({ admin_notificado_em: new Date().toISOString() })
        .eq("projeto_id", projetoId);
    } catch (erroEmail) {
      registrarErro("EMAIL_FALHOU", erroEmail);
    }

    // Resposta mínima: nada de IDs, nada de dados internos.
    return responder(201, { ok: true });
  } catch (erro) {
    if (erro instanceof ErroHttp) {
      return responder(erro.status, { ok: false, codigo: erro.codigo, mensagem: erro.mensagem });
    }
    registrarErro("ERRO_INTERNO", erro);
    return responder(500, { ok: false, codigo: "ERRO_INTERNO", mensagem: "Erro interno. Tente novamente mais tarde." });
  } finally {
    // Limpeza: imagem guardada, mas o projeto não foi criado (duplicado, erro no banco etc.).
    if (caminhoImagem && !projetoCriado) {
      try {
        await supabase.storage.from(BUCKET).remove([caminhoImagem]);
      } catch (erroLimpeza) {
        registrarErro("LIMPEZA_IMAGEM_FALHOU", erroLimpeza);
      }
    }
  }
});