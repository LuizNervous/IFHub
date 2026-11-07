import { useEffect, useId, useRef, useState } from "react";
import Tag from "../ui/Tag";
import Button from "../ui/Button";
import LikeButton from "../ui/LikeButton";
import { getTechColor } from "../../data/technologies";
import { isSafeUrl } from "../../utils/isSafeUrl";
import { isSafeImageSrc } from "../../utils/isSafeImageSrc";
import { getInitials } from "../../utils/getInitials";
import "./ProjetoModal.css";

function ProjetoModal({ project, onClose, liked, onToggleLike }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [imageFailed, setImageFailed] = useState(false);

  const {
    id, title, description, course, turma, tags = [],
    image, url, repoUrl, advisor, likes = 0,
    members = [], highlights = [],
  } = project;

  const hasSite = url && isSafeUrl(url);
  const hasRepo = repoUrl && isSafeUrl(repoUrl);
  const showImage = isSafeImageSrc(image) && !imageFailed;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const requestClose = () => dialogRef.current?.close();

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) requestClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
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

        {showImage && (
          <div
            className="modal__media"
            style={id ? { viewTransitionName: `project-cover-${id}` } : undefined}
          >
            <img
              src={image}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="modal__media-blur"
            />
            <img
              src={image}
              alt={`Captura de tela do projeto ${title}`}
              referrerPolicy="no-referrer"
              className="modal__media-image"
              onError={() => setImageFailed(true)}
            />
          </div>
        )}

        <div className="modal__body">
          <p className="modal__meta">
            {course} · {turma}
          </p>
          <h2 id={titleId} className="modal__title">{title}</h2>
          <p className="modal__description">{description}</p>

          {members.length > 0 && (
            <section className="modal__section">
              <h3 className="modal__heading">Integrantes</h3>
              <ul className="modal__members">
                {members.map((member, index) => (
                  <li
                    key={member.name}
                    className="modal__member modal__stagger-item"
                    style={{ "--stagger-index": index }}
                  >
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
                <p
                  className="modal__advisor modal__stagger-item"
                  style={{ "--stagger-index": members.length }}
                >
                  Orientação: <strong>{advisor}</strong>
                </p>
              )}
            </section>
          )}

          {highlights.length > 0 && (
            <section className="modal__section">
              <h3 className="modal__heading">Destaques</h3>
              <ul className="modal__highlights">
                {highlights.map((item, index) => (
                  <li
                    key={item}
                    className="modal__stagger-item"
                    style={{ "--stagger-index": members.length + 1 + index }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="modal__section">
            <h3 className="modal__heading">Tecnologias</h3>
            <ul className="modal__tags">
              {tags.map((tag, index) => (
                <li
                  key={tag}
                  className="modal__stagger-item"
                  style={{
                    "--stagger-index": members.length + highlights.length + 2 + index,
                  }}
                >
                  <Tag color={getTechColor(tag)}>{tag}</Tag>
                </li>
              ))}
            </ul>
          </section>

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
            <div className="modal__like">
              <LikeButton
                count={likes + (liked ? 1 : 0)}
                liked={liked}
                onToggle={onToggleLike}
                subject={title}
              />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default ProjetoModal;