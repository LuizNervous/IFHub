// validacao.ts
// Descreve, com o Zod, o formato EXATO que o servidor aceita.
// Os limites abaixo repetem os CHECK do banco (titulo 3-120, descricao 20-1000 etc.).
// Se o banco mudar, mude aqui também.

import { z } from "zod";
import { limparLinha, limparParagrafos, normalizarUrl } from "./utils.ts";

// "" vira "campo não enviado" (undefined) nos campos opcionais.
const vazioViraUndefined = (valor: unknown) =>
  typeof valor === "string" && valor.trim() === "" ? undefined : valor;

const opcional = <T extends z.ZodTypeAny>(esquema: T) =>
  z.preprocess(vazioViraUndefined, esquema.optional());

// Mensagens amigáveis, sempre dizendo QUAL campo e O QUE fazer.
const mensagemTamanho = (nome: string, min: number, max: number) => ({
  min: min <= 1 ? `Preencha o campo “${nome}”.` : `“${nome}” precisa ter pelo menos ${min} caracteres.`,
  max: `“${nome}” pode ter no máximo ${max} caracteres.`,
});

/** Texto de uma linha: limpa os caracteres estranhos ANTES de medir o tamanho. */
const linha = (nome: string, min: number, max: number) => {
  const m = mensagemTamanho(nome, min, max);
  return z
    .string({ required_error: `Preencha o campo “${nome}”.`, invalid_type_error: `“${nome}” em formato inválido.` })
    .transform(limparLinha)
    .pipe(z.string().min(min, m.min).max(max, m.max));
};

/** Texto com parágrafos (descrição). */
const paragrafos = (nome: string, min: number, max: number) => {
  const m = mensagemTamanho(nome, min, max);
  return z
    .string({ required_error: `Preencha o campo “${nome}”.`, invalid_type_error: `“${nome}” em formato inválido.` })
    .transform(limparParagrafos)
    .pipe(z.string().min(min, m.min).max(max, m.max));
};

/** URL: só http/https, sem usuário:senha, sem IP/localhost. Devolve a versão normalizada. */
const endereco = (nome: string) =>
  z
    .string({ invalid_type_error: `“${nome}” em formato inválido.` })
    .transform((valor, ctx) => {
      const normalizada = normalizarUrl(valor);
      if (normalizada === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            `O link de “${nome}” é inválido. Use um endereço completo começando com http:// ou https://, ` +
            `de um site com domínio (não são aceitos IP, localhost nem usuário e senha no link).`,
        });
        return z.NEVER;
      }
      return normalizada;
    });

const integrante = z
  .object({
    nome: linha("nome do integrante", 2, 100),
    funcao: opcional(linha("função do integrante", 2, 60)),
  })
  .strict();

/** O PROJETO. `.strict()` rejeita qualquer campo que não esteja listado (ex.: "status"). */
export const ProjetoSchema = z
  .object({
    titulo: linha("título", 3, 120),
    descricao: paragrafos("descrição", 20, 1000),
    turma: linha("turma", 2, 20),
    orientador: opcional(linha("orientador", 2, 100)),
    site_url: opcional(endereco("site")),
    repo_url: opcional(endereco("repositório")),
    tecnologias: z
      .array(linha("tecnologia", 1, 40), { required_error: "Escolha ao menos uma tecnologia." })
      .min(1, "Escolha ao menos uma tecnologia.")
      .max(8, "Escolha no máximo 8 tecnologias.")
      .refine(
        (lista) => new Set(lista.map((t) => t.toLowerCase())).size === lista.length,
        "Há tecnologias repetidas.",
      ),
    integrantes: z
      .array(integrante, { required_error: "Informe ao menos um integrante." })
      .min(1, "Informe ao menos um integrante.")
      .max(10, "Informe no máximo 10 integrantes."),
    destaques: z
      .array(linha("destaque", 3, 300))
      .max(6, "Informe no máximo 6 destaques.")
      .default([]),
  })
  .strict()
  .refine((p) => p.site_url !== undefined || p.repo_url !== undefined, {
    message: "Informe o link do site ou o link do repositório (pelo menos um).",
    path: ["site_url"],
  });

const emailContato = z
  .string({ required_error: "Informe seu e-mail de contato." })
  .transform((valor) => limparLinha(valor).toLowerCase())
  .pipe(
    z
      .string()
      .min(5, "Informe um e-mail válido.")
      .max(254, "O e-mail pode ter no máximo 254 caracteres.")
      .email("Informe um e-mail válido."),
  );

/** O CORPO da requisição: projeto + e-mail + os dois campos anti-robô. */
export const CorpoSchema = z
  .object({
    projeto: ProjetoSchema,
    email_contato: emailContato,
    hp: z.string().max(200).optional(), // honeypot: um humano nunca preenche
    tempo_ms: z.number().finite().optional(), // quanto tempo o formulário ficou aberto
  })
  .strict();

/** Transforma os erros do Zod em { "campo": "mensagem" }, pronto para o front mostrar. */
export function formatarErros(erro: z.ZodError): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const problema of erro.issues) {
    const caminho = problema.path.join(".").replace(/^projeto\./, "");
    const chave = caminho === "" || caminho === "projeto" ? "_form" : caminho;
    if (chave in saida) continue; // uma mensagem por campo basta
    saida[chave] =
      problema.code === "unrecognized_keys"
        ? "Foram enviados campos que não fazem parte do formulário."
        : problema.message;
  }
  return saida;
}
