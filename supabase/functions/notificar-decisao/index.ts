// supabase/functions/notificar-decisao/index.ts
// deno-lint-ignore-file
import { createClient } from "@supabase/supabase-js";
import nodemailer from "npm:nodemailer@6.9.13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escaparHtml(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verifica se o usuário que chamou a função está logado e é ADMIN
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ erro: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ erro: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRow } = await supabaseAdmin
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ erro: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Recebe os dados da decisão: { projeto_id, decisao: "aprovado" | "rejeitado", motivo?: string }
    const { projeto_id, decisao, motivo } = await req.json();

    if (!projeto_id || !["aprovado", "rejeitado"].includes(decisao)) {
      return new Response(JSON.stringify({ erro: "Dados inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Busca os dados do projeto e o e-mail de contato na tabela projeto_submissoes
    const { data: projeto } = await supabaseAdmin
      .from("projetos")
      .select("titulo, turma, site_url")
      .eq("id", projeto_id)
      .single();

    const { data: submissao } = await supabaseAdmin
      .from("projeto_submissoes")
      .select("email_contato")
      .eq("projeto_id", projeto_id)
      .maybeSingle();

    const emailAluno = submissao?.email_contato?.trim();

    if (!emailAluno || !emailAluno.includes("@") || !projeto) {
      return new Response(
        JSON.stringify({ ok: true, aviso: "Projeto sem e-mail de contato cadastrado." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GMAIL_USER || !GMAIL_PASS) {
      throw new Error("GMAIL_NAO_CONFIGURADO");
    }

    // 4. Monta o e-mail de acordo com a decisão (Aprovado ou Rejeitado)
    const aprovado = decisao === "aprovado";
    const assunto = aprovado
      ? `[IFHub] Seu projeto foi aprovado: ${projeto.titulo}`
      : `[IFHub] Atualização sobre o projeto: ${projeto.titulo}`;

    const html = aprovado
      ? `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#0f172a;line-height:1.6">
          <h2 style="margin:0 0 12px;color:#14b8a6">Parabéns! O seu projeto foi aprovado no IFHub 🎉</h2>
          <p>Olá! O projeto <b>${escaparHtml(projeto.titulo)}</b> (turma <b>${escaparHtml(projeto.turma)}</b>) foi revisado e aprovado.</p>
          <p>Ele já está publicado e visível para todos na galeria oficial do <b>IFHub</b>!</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
          <p style="font-size:12px;color:#64748b">IFHub · IFPR Campus Assis Chateaubriand</p>
        </div>`
      : `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#0f172a;line-height:1.6">
          <h2 style="margin:0 0 12px;color:#f43f5e">Atualização sobre o envio do seu projeto</h2>
          <p>Olá! O projeto <b>${escaparHtml(projeto.titulo)}</b> (turma <b>${escaparHtml(projeto.turma)}</b>) foi analisado pela equipe do IFHub e não pôde ser aprovado neste momento.</p>
          ${
            motivo
              ? `<p style="background:#f8fafc;padding:12px;border-left:4px solid #f43f5e"><b>Observação do avaliador:</b><br>${escaparHtml(motivo)}</p>`
              : ""
          }
          <p>Você pode fazer os ajustes necessários e submeter o projeto novamente pelo site.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
          <p style="font-size:12px;color:#64748b">IFHub · IFPR Campus Assis Chateaubriand</p>
        </div>`;

    const texto = aprovado
      ? `Parabéns! O seu projeto "${projeto.titulo}" (${projeto.turma}) foi aprovado e já está publicado no IFHub!`
      : `Olá! O projeto "${projeto.titulo}" (${projeto.turma}) não pôde ser aprovado neste momento.` +
        (motivo ? `\nMotivo: ${motivo}` : "") +
        `\nVocê pode fazer os ajustes e enviá-lo novamente.`;

    // 5. Envia o e-mail pelo Gmail
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: Deno.env.get("EMAIL_FROM") ?? `IFHub <${GMAIL_USER}>`,
      to: emailAluno,
      subject: assunto,
      html,
      text: texto,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail de decisão:", err);
    return new Response(JSON.stringify({ ok: false, erro: "Falha ao enviar e-mail" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});