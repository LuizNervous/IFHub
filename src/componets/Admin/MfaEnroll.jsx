import { useState } from "react";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import { supabase } from "../../lib/supabase";

// Primeira vez: o admin configura o app autenticador (Google Authenticator, Authy, 1Password...).
// É OBRIGATÓRIO: sem isso o banco não reconhece a sessão como admin.
function MfaEnroll({ onConcluido }) {
  const [fase, setFase] = useState("inicio"); // "inicio" | "codigo"
  const [fator, setFator] = useState(null); // { id, qr, segredo }
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function iniciar() {
    setOcupado(true);
    setErro("");
    try {
      // Apaga tentativas anteriores abandonadas (fatores que nunca foram confirmados)
      const { data: lista } = await supabase.auth.mfa.listFactors();
      for (const f of lista?.all ?? []) {
        if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `IFHub ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;

      setFator({ id: data.id, qr: data.totp.qr_code, segredo: data.totp.secret });
      setFase("codigo");
    } catch {
      setErro("Não foi possível iniciar a configuração. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function confirmar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    if (!/^\d{6}$/.test(codigo)) {
      setErro("Digite os 6 números que aparecem no app.");
      return;
    }
    setOcupado(true);
    setErro("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fator.id, code: codigo });
    setOcupado(false);
    if (error) {
      setErro("Código inválido ou expirado. Confira o app e tente de novo.");
      setCodigo("");
      return;
    }
    await onConcluido(); // a sessão agora é "aal2": o estado é recalculado
  }

  if (fase === "inicio") {
    return (
      <div className="admin-form">
        <ol className="admin-steps">
          <li>Instale um app autenticador no celular (Google Authenticator, Authy, Microsoft Authenticator...).</li>
          <li>Escaneie o QR code que vai aparecer.</li>
          <li>Digite o código de 6 números que o app mostrar.</li>
        </ol>
        <p className="admin-note">
          Isto protege o painel mesmo que a sua senha vaze: sem o código do celular, ninguém entra.
        </p>
        {erro && <p className="admin-alert admin-alert--erro" role="alert">{erro}</p>}
        <Button variant="primary" onClick={iniciar} disabled={ocupado} aria-busy={ocupado}>
          {ocupado ? "Preparando…" : "Configurar autenticação em duas etapas"}
        </Button>
      </div>
    );
  }

  // Só mostramos o QR se for mesmo uma imagem "data:" do Supabase (nunca um endereço externo)
  const qrSeguro = typeof fator.qr === "string" && fator.qr.startsWith("data:image/svg+xml");

  return (
    <form className="admin-form" onSubmit={confirmar} noValidate>
      {qrSeguro && (
        <div className="mfa-qr">
          <img src={fator.qr} alt="QR code para configurar o app autenticador" width="200" height="200" />
        </div>
      )}
      <p className="admin-note">
        Sem câmera? Digite este código no app, como chave manual:
        <code className="mfa-secret">{fator.segredo}</code>
      </p>
      <FormField
        id="campo-mfa-codigo"
        label="Código de 6 números"
        value={codigo}
        error={erro}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        onChange={(e) => {
          setCodigo(e.target.value.replace(/\D/g, ""));
          setErro("");
        }}
      />
      <p className="admin-note admin-note--warn">
        Guarde a chave manual em um lugar seguro. Se perder o celular, só dá para recuperar o acesso
        pelo painel do Supabase.
      </p>
      <Button type="submit" variant="primary" disabled={ocupado} aria-busy={ocupado}>
        {ocupado ? "Verificando…" : "Confirmar e entrar"}
      </Button>
    </form>
  );
}

export default MfaEnroll;