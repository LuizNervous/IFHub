import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthShell from "../../componets/Admin/AuthShell";
import FormField from "../../componets/ui/FormField";
import Button from "../../componets/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useNoIndex } from "../../hooks/useNoIndex";
import "../../componets/Admin/Admin.css";

// Mensagem ÚNICA para qualquer falha: não dizemos se foi o e-mail ou a senha que errou
// (isso ajudaria um atacante a descobrir quais e-mails existem).
function mensagemDeLogin(erro) {
  if (erro?.status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  if (erro?.name === "AuthRetryableFetchError") return "Sem conexão com o servidor. Tente de novo.";
  return "E-mail ou senha incorretos.";
}

function AdminLoginPage() {
  useNoIndex();
  const { estado, entrar, recuperarSenha } = useAuth();
  const aviso = useLocation().state?.aviso; // vem da tela de redefinição de senha

  const [modo, setModo] = useState("entrar"); // "entrar" | "recuperar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // Já está logado? Vai direto para o painel (o AuthGuard cuida do MFA).
  if (estado !== "carregando" && estado !== "anonimo") return <Navigate to="/admin" replace />;

  async function aoEntrar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    if (!email.trim() || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      await entrar(email.trim(), senha);
      // sucesso: o estado muda sozinho e o <Navigate> acima leva ao painel
    } catch (e) {
      setErro(mensagemDeLogin(e));
      setSenha("");
    } finally {
      setOcupado(false);
    }
  }

  async function aoRecuperar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErro("Informe um e-mail válido.");
      return;
    }
    setOcupado(true);
    setErro("");
    const { error } = await recuperarSenha(email.trim());
    setOcupado(false);
    if (error?.status === 429) {
      setErro("Muitos pedidos. Aguarde alguns minutos e tente de novo.");
      return;
    }
    // Resposta NEUTRA: não confirmamos se o e-mail existe ou não.
    setEnviado(true);
  }

  if (modo === "recuperar") {
    return (
      <AuthShell title="Redefinir senha" subtitle="Enviaremos um link para o seu e-mail.">
        {enviado ? (
          <p className="admin-alert admin-alert--ok" role="status">
            Se este e-mail pertence a um administrador, enviamos o link de redefinição. Confira a caixa de
            entrada e o spam.
          </p>
        ) : (
          <form className="admin-form" onSubmit={aoRecuperar} noValidate>
            <FormField
              id="campo-admin-email"
              type="email"
              label="E-mail"
              value={email}
              error={erro}
              autoComplete="username"
              onChange={(e) => { setEmail(e.target.value); setErro(""); }}
            />
            <Button type="submit" variant="primary" disabled={ocupado} aria-busy={ocupado}>
              {ocupado ? "Enviando…" : "Enviar link"}
            </Button>
          </form>
        )}
        <button type="button" className="admin-link" onClick={() => { setModo("entrar"); setErro(""); setEnviado(false); }}>
          ← Voltar ao login
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Área administrativa" subtitle="Acesso restrito à equipe do IFHub.">
      {aviso && <p className="admin-alert admin-alert--ok" role="status">{aviso}</p>}
      <form className="admin-form" onSubmit={aoEntrar} noValidate>
        <FormField
          id="campo-admin-email"
          type="email"
          label="E-mail"
          value={email}
          autoComplete="username"
          onChange={(e) => { setEmail(e.target.value); setErro(""); }}
        />
        <FormField
          id="campo-admin-senha"
          type="password"
          label="Senha"
          value={senha}
          error={erro}
          autoComplete="current-password"
          onChange={(e) => { setSenha(e.target.value); setErro(""); }}
        />
        <Button type="submit" variant="primary" disabled={ocupado} aria-busy={ocupado}>
          {ocupado ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <button type="button" className="admin-link" onClick={() => { setModo("recuperar"); setErro(""); }}>
        Esqueci minha senha
      </button>
    </AuthShell>
  );
}

export default AdminLoginPage;