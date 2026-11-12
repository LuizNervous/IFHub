import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Estados possíveis (o AuthGuard decide o que mostrar em cada um):
//   "carregando"   → ainda não sabe se está logado
//   "anonimo"      → não está logado
//   "mfa-cadastro" → logado, mas ainda NÃO configurou o app autenticador (obrigatório)
//   "mfa"          → logado com senha, falta o código do app autenticador
//   "admin"        → senha + código confirmados, e é admin
//   "negado"       → logado com MFA, mas NÃO é admin
//   "erro"         → não deu para verificar (rede, por exemplo)
//
// IMPORTANTE: tudo isto é só EXPERIÊNCIA. A segurança de verdade mora no banco:
// private.is_admin() só devolve true para quem está em "admins" E tem sessão "aal2".
export function useAuth() {
  const [estado, setEstado] = useState("carregando");
  const [usuario, setUsuario] = useState(null);

  const verificar = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUsuario(null);
      setEstado("anonimo");
      return;
    }
    setUsuario(session.user);

    // 1) O admin precisa ter um app autenticador configurado (fatores TOTP já verificados).
    const { data: fatores, error: erroFatores } = await supabase.auth.mfa.listFactors();
    if (erroFatores) return setEstado("erro");
    if ((fatores?.totp ?? []).length === 0) return setEstado("mfa-cadastro");

    // 2) A sessão atual precisa ter passado pelo código: "aal2" = senha + MFA.
    const { data: nivel, error: erroNivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (erroNivel) return setEstado("erro");
    if (nivel?.currentLevel !== "aal2") return setEstado("mfa");

    // 3) O banco confirma que é admin (o mesmo is_admin() que protege todas as tabelas).
    const { data: ehAdmin, error: erroAdmin } = await supabase.rpc("is_admin_check");
    if (erroAdmin) return setEstado("erro");
    setEstado(ehAdmin === true ? "admin" : "negado");
  }, []);

  useEffect(() => {
    verificar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Não chamamos o Supabase direto aqui dentro: isso pode travar. Adiamos para o próximo ciclo.
      setTimeout(verificar, 0);
    });

    return () => subscription.unsubscribe();
  }, [verificar]);

  const entrar = async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    // onAuthStateChange dispara e o estado é recalculado sozinho
  };

  const sair = async () => {
    await supabase.auth.signOut();
  };

  // O e-mail leva ao /admin/redefinir-senha. Esse endereço precisa estar na lista
  // "Redirect URLs" do Supabase (Authentication → URL Configuration).
  const recuperarSenha = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/redefinir-senha`,
    });

  return { estado, usuario, entrar, sair, recuperarSenha, reverificar: verificar };
}