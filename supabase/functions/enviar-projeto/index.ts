// index.ts — Edge Function "enviar-projeto"
//
// Ordem das defesas (cada uma só roda se a anterior passou):
//   1. origem permitida (CORS)  →  2. método e tipo do conteúdo
//   3. rate limit por IP (no banco)  →  4. corpo com tamanho máximo
//   5. anti-robô (honeypot + tempo)  →  6. validação estrita (Zod)
//   7. gravação atômica (função SQL; status fixo "pendente")  →  8. e-mail aos admins

import { createClient } from "@supabase/supabase-js";
import { CorpoSchema, formatarErros } from "./validacao.ts";
import { hmacHex, obterIp } from "./utils.ts";
import { notificarAdmins } from "./email.ts";

const MAX_CORPO_BYTES = 20 * 1024; // 20 KB é muito mais do que o formulário precisa
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

    // 7) Gravação atômica. O status "pendente" está dentro da função SQL, não aqui.
    const { data: projetoId, error: erroBanco } = await supabase.rpc("criar_projeto_pendente", {
      p: projeto,
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

    // 8) Aviso aos admins. O projeto JÁ está salvo: se o e-mail falhar, o envio continua válido.
    try {
      await notificarAdmins({
        id: projetoId as number,
        titulo: projeto.titulo,
        turma: projeto.turma,
        tecnologias: projeto.tecnologias,
        totalIntegrantes: projeto.integrantes.length,
        site_url: projeto.site_url,
        repo_url: projeto.repo_url,
      });
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
  }
});
