import { useEffect, useRef } from "react";
import Button from "../ui/Button";

// Tela mostrada depois que o servidor confirma o recebimento.
// Importante: dizemos "recebemos e vamos analisar", NUNCA "publicado".
function EnvioConcluido({ titulo, onNovoEnvio }) {
  const tituloRef = useRef(null);

  // Ao aparecer: volta ao topo e leva o foco ao título (leitores de tela anunciam a mudança).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    tituloRef.current?.focus();
  }, []);

  return (
    <section className="done" aria-labelledby="done-title">
      <div className="done__card">
        <svg className="done__icon" viewBox="0 0 52 52" aria-hidden="true">
          <circle className="done__circle" cx="26" cy="26" r="23" />
          <path className="done__check" d="M15 27l8 8 14-16" />
        </svg>

        <h1 id="done-title" ref={tituloRef} tabIndex={-1} className="done__title">
          Projeto enviado!
        </h1>
        <p className="done__text">
          Recebemos <strong>{titulo.trim()}</strong>. Ele está <strong>aguardando aprovação</strong> de um
          administrador e ainda não aparece no site.
        </p>

        <ol className="done__timeline">
          <li className="is-done">
            <span aria-hidden="true">✓</span> Enviado
          </li>
          <li className="is-current" aria-current="step">
            <span aria-hidden="true">2</span> Em análise
          </li>
          <li>
            <span aria-hidden="true">3</span> Publicado
          </li>
        </ol>

        <div className="done__actions">
          <Button to="/" variant="primary">
            Voltar ao início
          </Button>
          <Button variant="ghost" onClick={onNovoEnvio}>
            Enviar outro projeto
          </Button>
        </div>
      </div>
    </section>
  );
}

export default EnvioConcluido;