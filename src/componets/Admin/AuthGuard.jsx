import { Navigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import MfaEnroll from "./MfaEnroll";
import MfaVerify from "./MfaVerify";
import Button from "../ui/Button";

// Envolve a rota /admin. Lê o estado calculado por useAuth() e decide o que mostrar.
// Os `children` (o painel) SÓ são montados quando o estado é "admin": os dados nem são pedidos antes disso.
//
// Lembrete: isto NÃO é a segurança. Se alguém burlasse este componente no navegador, o banco
// continuaria recusando tudo (RLS + is_admin() com MFA). Aqui só decidimos o que desenhar.
function AuthGuard({ estado, usuario, onReverificar, onSair, children }) {
  if (estado === "carregando") {
    return (
      <div className="auth-loading" role="status">
        <span className="auth-loading__spinner" aria-hidden="true" />
        <span className="visually-hidden">Verificando acesso…</span>
      </div>
    );
  }

  if (estado === "anonimo") return <Navigate to="/admin/login" replace />;

  if (estado === "mfa-cadastro") {
    return (
      <AuthShell
        title="Proteja sua conta"
        subtitle="Antes de entrar no painel, configure a autenticação em duas etapas."
      >
        <MfaEnroll onConcluido={onReverificar} />
        <button type="button" className="admin-link" onClick={onSair}>Sair</button>
      </AuthShell>
    );
  }

  if (estado === "mfa") {
    return (
      <AuthShell title="Confirme que é você" subtitle="Abra o app autenticador e digite o código atual.">
        <MfaVerify onConcluido={onReverificar} />
        <button type="button" className="admin-link" onClick={onSair}>Sair</button>
      </AuthShell>
    );
  }

  if (estado === "negado") {
    return (
      <AuthShell title="Acesso negado">
        <p className="admin-alert admin-alert--erro" role="alert">
          A conta {usuario?.email} não tem permissão de administrador.
        </p>
        <Button variant="ghost" onClick={onSair}>Sair</Button>
      </AuthShell>
    );
  }

  if (estado === "erro") {
    return (
      <AuthShell title="Não foi possível verificar">
        <p className="admin-alert admin-alert--erro" role="alert">
          Houve um problema de conexão ao verificar o seu acesso.
        </p>
        <Button variant="primary" onClick={onReverificar}>Tentar de novo</Button>
      </AuthShell>
    );
  }

  return children; // estado === "admin"
}

export default AuthGuard;