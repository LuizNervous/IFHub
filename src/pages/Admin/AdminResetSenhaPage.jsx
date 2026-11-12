import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../componets/Admin/AuthShell";
import FormField from "../../componets/ui/FormField";
import Button from "../../componets/ui/Button";
import { supabase } from "../../lib/supabase";
import { useNoIndex } from "../../hooks/useNoIndex";
import { SENHA, validarNovaSenha } from "../../utils/validarSenha";
import "../../componets/Admin/Admin.css";

// Para onde o link do e-mail de redefinição leva. O Supabase abre uma sessão temporária de
// "recuperação" a partir do link; aqui o admin escolhe a nova senha.
function AdminResetSenhaPage() {
  useNoIndex();
  const navigate = useNavigate();
  const [fase, setFase] = useState("verificando"); // "verificando" | "pronto" | "invalido"
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    // A sessão de recuperação pode já existir (o Supabase lê o link ao carregar) ou chegar logo depois.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelado) setFase(session ? "pronto" : "invalido");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY" && !cancelado) setFase("pronto");
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, []);

  async function salvar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    const problema = validarNovaSenha(senha, confirmacao);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado(true);
    setErro("");
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setOcupado(false);
      setErro("Não foi possível alterar a senha. O link pode ter expirado, ou a senha é fraca demais.");
      return;
    }
    // Encerra a sessão de recuperação: o admin precisa entrar de novo (senha nova + código do app).
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true, state: { aviso: "Senha atualizada. Entre com a nova senha." } });
  }

  if (fase === "verificando") {
    return (
      <div className="auth-loading" role="status">
        <span className="auth-loading__spinner" aria-hidden="true" />
        <span className="visually-hidden">Verificando o link…</span>
      </div>
    );
  }

  if (fase === "invalido") {
    return (
      <AuthShell title="Link inválido ou expirado">
        <p className="admin-note">Peça um novo link de redefinição na tela de login.</p>
        <Link to="/admin/login" className="admin-link">← Ir para o login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Escolha a nova senha" subtitle={`Use pelo menos ${SENHA.min} caracteres, com letras e números.`}>
      <form className="admin-form" onSubmit={salvar} noValidate>
        <FormField
          id="campo-nova-senha"
          type="password"
          label="Nova senha"
          value={senha}
          autoComplete="new-password"
          onChange={(e) => { setSenha(e.target.value); setErro(""); }}
        />
        <FormField
          id="campo-confirma-senha"
          type="password"
          label="Repita a nova senha"
          value={confirmacao}
          error={erro}
          autoComplete="new-password"
          onChange={(e) => { setConfirmacao(e.target.value); setErro(""); }}
        />
        <Button type="submit" variant="primary" disabled={ocupado} aria-busy={ocupado}>
          {ocupado ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default AdminResetSenhaPage;