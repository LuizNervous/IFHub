// email.ts
// Avisa os administradores que existe um projeto pendente.
//
// Regras de segurança deste e-mail:
//  - todo texto vindo do visitante passa por escaparHtml();
//  - os links enviados pelo aluno aparecem como TEXTO, nunca como link clicável;
//  - NÃO existe link de "aprovar": a aprovação só acontece num painel com login.

import { escaparHtml } from "./utils.ts";

export interface ResumoProjeto {
  id: number;
  titulo: string;
  turma: string;
  tecnologias: string[];
  totalIntegrantes: number;
  site_url?: string;
  repo_url?: string;
  imagem_url: string; // endereço do NOSSO bucket (gerado pelo servidor, nunca pelo usuário)
}

function lerConfiguracao() {
  const chave = Deno.env.get("RESEND_API_KEY");
  const destinatarios = (Deno.env.get("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  // onboarding@resend.dev é o remetente de teste do Resend (sem domínio próprio).
  const de = Deno.env.get("EMAIL_FROM") ?? "IFHub <onboarding@resend.dev>";

  if (!chave || destinatarios.length === 0) throw new Error("EMAIL_NAO_CONFIGURADO");
  return { chave, destinatarios, de };
}

export async function notificarAdmins(r: ResumoProjeto): Promise<void> {
  const { chave, destinatarios, de } = lerConfiguracao();

  const linhas: [string, string][] = [
    ["Título", r.titulo],
    ["Turma", r.turma],
    ["Tecnologias", r.tecnologias.join(", ")],
    ["Integrantes", String(r.totalIntegrantes)],
    ["Site", r.site_url ?? "—"],
    ["Repositório", r.repo_url ?? "—"],
    ["Imagem (print)", r.imagem_url],
    ["ID do projeto", String(r.id)],
  ];

  const tabela = linhas
    .map(
      ([rotulo, valor]) =>
        `<tr><td style="padding:6px 12px;color:#555"><b>${escaparHtml(rotulo)}</b></td>` +
        `<td style="padding:6px 12px"><code>${escaparHtml(valor)}</code></td></tr>`,
    )
    .join("");

  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:560px">` +
    `<h2 style="margin:0 0 12px">Novo projeto aguardando aprovação</h2>` +
    `<table style="border-collapse:collapse">${tabela}</table>` +
    `<p style="color:#555;margin-top:16px">Revise o projeto no painel de administração ` +
    `(por enquanto: Supabase → Table Editor → <b>projetos</b>, filtrando por status = pendente). ` +
    `Não clique nos links acima sem verificar. Este e-mail não contém nenhum link de aprovação.</p></div>`;

  const texto =
    "Novo projeto aguardando aprovação\n\n" +
    linhas.map(([rotulo, valor]) => `${rotulo}: ${valor}`).join("\n") +
    "\n\nRevise no painel de administração. Não existe link de aprovação neste e-mail.";

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: de,
      to: destinatarios,
      subject: `[IFHub] Projeto pendente: ${r.titulo.slice(0, 80)}`,
      html,
      text: texto,
    }),
    signal: AbortSignal.timeout(8000), // não deixa a função presa se o Resend demorar
  });

  if (!resposta.ok) throw new Error(`RESEND_${resposta.status}`);
}
