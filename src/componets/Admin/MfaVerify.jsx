import { useEffect, useState } from "react";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import { supabase } from "../../lib/supabase";

// Todo login: depois da senha, o admin digita o código do app autenticador.
function MfaVerify({ onConcluido }) {
  const [fatorId, setFatorId] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (!cancelado) setFatorId(data?.totp?.[0]?.id ?? null);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  async function confirmar(evento) {
    evento.preventDefault();
    if (ocupado || !fatorId) return;
    if (!/^\d{6}$/.test(codigo)) {
      setErro("Digite os 6 números que aparecem no app.");
      return;
    }
    setOcupado(true);
    setErro("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: codigo });
    setOcupado(false);
    if (error) {
      setErro("Código inválido ou expirado. Confira o app e tente de novo.");
      setCodigo("");
      return;
    }
    await onConcluido();
  }

  return (
    <form className="admin-form" onSubmit={confirmar} noValidate>
      <FormField
        id="campo-mfa-codigo"
        label="Código do app autenticador"
        value={codigo}
        error={erro}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        autoFocus
        onChange={(e) => {
          setCodigo(e.target.value.replace(/\D/g, ""));
          setErro("");
        }}
      />
      <Button type="submit" variant="primary" disabled={ocupado || !fatorId} aria-busy={ocupado}>
        {ocupado ? "Verificando…" : "Verificar"}
      </Button>
    </form>
  );
}

export default MfaVerify;