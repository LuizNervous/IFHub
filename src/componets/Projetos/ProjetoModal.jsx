import { useEffect, useId, useRef } from "react";
import Tag from "../ui/Tag";
import Button from "../ui/Button";
import { getTechColor } from "../../data/technologies";
import { isSafeUrl } from "../../utils/isSafeUrl";
import { getInitials } from "../../utils/getInitials";
import "./ProjetoModal.css";


function ProjetoModal({ project, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  const {
    title, description, course, turma, tags,
    url, repoUrl, advisor,
    members = [], highlights = [],
  } = project;

  const hasSite = url && isSafeUrl(url);
  const hasRepo = repoUrl && isSafeUrl(repoUrl);

  // Quando o modal aparece, pedimos ao navegador para abri-lo como janela modal.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Fechamos pelo próprio <dialog>: assim o navegador devolve o foco
  // ao botão "Saiba mais" que abriu a janela (bom para teclado).
  const requestClose = () => dialogRef.current?.close();

  // Clique no fundo escuro = o alvo do clique é o próprio <dialog>.
  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) requestClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose} // dispara ao fechar (botão, fundo ou tecla Esc)
      onClick={handleBackdropClick}
    >
      <div className="modal__content">
        <button
          type="button"
          className="modal__close"
          onClick={requestClose}
          aria-label="Fechar janela"
        >
          ×
        </button>

        <p className="modal__meta">
          {course} · {turma}
        </p>
        <h2 id={titleId} className="modal__title">{title}</h2>
        <p className="modal__description">{description}</p>

        {members.length > 0 && (
          <section className="modal__section">
            <h3 className="modal__heading">Integrantes</h3>
            <ul className="modal__members">
              {members.map((member) => (
                <li key={member.name} className="modal__member">
                  <span className="modal__avatar" aria-hidden="true">
                    {getInitials(member.name)}
                  </span>
                  <span>
                    <span className="modal__member-name">{member.name}</span>
                    <span className="modal__member-role">{member.role}</span>
                  </span>
                </li>
              ))}
            </ul>
            {advisor && (
              <p className="modal__advisor">
                Orientação: <strong>{advisor}</strong>
              </p>
            )}
          </section>
        )}

        {highlights.length > 0 && (
          <section className="modal__section">
            <h3 className="modal__heading">Destaques</h3>
            <ul className="modal__highlights">
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="modal__section">
          <h3 className="modal__heading">Tecnologias</h3>
          <ul className="modal__tags">
            {tags.map((tag) => (
              <li key={tag}>
                <Tag color={getTechColor(tag)}>{tag}</Tag>
              </li>
            ))}
          </ul>
        </section>

        {(hasSite || hasRepo) && (
          <div className="modal__actions">
            {hasSite && (
              <Button href={url} variant="primary" target="_blank" rel="noopener noreferrer">
                Visitar projeto
              </Button>
            )}
            {hasRepo && (
              <Button href={repoUrl} variant="ghost" target="_blank" rel="noopener noreferrer">
                Ver código
              </Button>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}

export default ProjetoModal;