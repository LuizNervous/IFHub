// email.ts
// Avisa os administradores que existe um projeto pendente e envia confirmação ao aluno.
//
// Regras de segurança deste e-mail:
//  - todo texto vindo do visitante passa por escaparHtml();
//  - os links enviados pelo aluno aparecem como TEXTO, nunca como link clicável;
//  - NÃO existe link de "aprovar": a aprovação só acontece num painel com login.

// deno-lint-ignore no-import-prefix
import nodemailer from "npm:nodemailer@6.9.13";
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
  email_contato?: string; // e-mail da pessoa que submeteu o projeto
}

function lerConfiguracao() {
  const usuarioGmail = Deno.env.get("GMAIL_USER");
  const senhaAppGmail = Deno.env.get("GMAIL_APP_PASSWORD");

  // Se ADMIN_EMAILS estiver definido nos Secrets, usa a lista; caso contrário, envia para o próprio GMAIL_USER
  const destinatarios = (Deno.env.get("ADMIN_EMAILS") ?? usuarioGmail ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const de = Deno.env.get("EMAIL_FROM") ?? `IFHub <${usuarioGmail}>`;

  if (!usuarioGmail || !senhaAppGmail || destinatarios.length === 0) {
    throw new Error("EMAIL_NAO_CONFIGURADO");
  }

  return { usuarioGmail, senhaAppGmail, destinatarios, de };
}

export async function notificarAdmins(r: ResumoProjeto): Promise<void> {
  const { usuarioGmail, senhaAppGmail, destinatarios, de } = lerConfiguracao();

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL na porta 465
    auth: {
      user: usuarioGmail,
      pass: senhaAppGmail,
    },
    connectionTimeout: 8000, // não deixa a função presa se o servidor SMTP demorar
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  const linhas: [string, string][] = [
    ["Título", r.titulo],
    ["Turma", r.turma],
    ["Tecnologias", r.tecnologias.join(", ")],
    ["Integrantes", String(r.totalIntegrantes)],
    ["Site", r.site_url ?? "—"],
    ["Repositório", r.repo_url ?? "—"],
    ["E-mail de contato", r.email_contato ?? "—"],
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

  const htmlAdmin =
    `<div style="font-family:system-ui,sans-serif;max-width:560px">` +
    `<h2 style="margin:0 0 12px">Novo projeto aguardando aprovação</h2>` +
    `<table style="border-collapse:collapse">${tabela}</table>` +
    `<p style="color:#555;margin-top:16px">Revise o projeto no painel de administração ` +
    `(por enquanto: Supabase → Table Editor → <b>projetos</b>, filtrando por status = pendente). ` +
    `Não clique nos links acima sem verificar. Este e-mail não contém nenhum link de aprovação.</p></div>`;

  const textoAdmin =
    "Novo projeto aguardando aprovação\n\n" +
    linhas.map(([rotulo, valor]) => `${rotulo}: ${valor}`).join("\n") +
    "\n\nRevise no painel de administração. Não existe link de aprovação neste e-mail.";

  // 1) Envia o aviso aos administradores
  try {
    await transporter.sendMail({
      from: de,
      to: destinatarios.join(", "),
      subject: `[IFHub] Projeto pendente: ${r.titulo.slice(0, 80)}`,
      html: htmlAdmin,
      text: textoAdmin,
    });
  } catch {
    throw new Error("SMTP_ADMIN_FALHOU");
  }

  // 2) Envia o e-mail de confirmação para a pessoa que adicionou o projeto (se não for o próprio admin)
  const emailAluno = r.email_contato?.trim();
  if (emailAluno && emailAluno.includes("@") && !destinatarios.includes(emailAluno)) {
    const htmlAluno =
      `<div style="font-family:system-ui,sans-serif;max-width:560px">` +
      `<h2 style="margin:0 0 12px">Recebemos o seu projeto no IFHub!</h2>` +
      `<p>Olá! O projeto <b>${escaparHtml(r.titulo)}</b> (turma <b>${escaparHtml(r.turma)}</b>) ` +
      `foi enviado com sucesso e está aguardando a revisão de um administrador.</p>` +
      `<p style="color:#555;margin-top:16px">Assim que for aprovado, ele aparecerá automaticamente na galeria pública do IFHub.</p>` +
      `</div>`;

    const textoAluno =
      `Recebemos o seu projeto no IFHub!\n\n` +
      `O projeto "${r.titulo}" (turma ${r.turma}) foi enviado com sucesso e está aguardando revisão.\n` +
      `Assim que for aprovado, ele aparecerá na galeria do IFHub.`;

    try {
      await transporter.sendMail({
        from: de,
        to: emailAluno,
        subject: `[IFHub] Recebemos seu projeto: ${r.titulo.slice(0, 80)}`,
        html: htmlAluno,
        text: textoAluno,
      });
    } catch {
      // Se o aluno digitou um e-mail inexistente, o aviso do admin já foi enviado com sucesso
      console.warn("SMTP_ALUNO_FALHOU");
    }
  }
}