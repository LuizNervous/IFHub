import { useState } from "react";
import { flushSync } from "react-dom";
import { useSpotlight } from "../../hooks/useSpotlight";
import Tag from "../ui/Tag";
import Button from "../ui/Button";
import SafeImage from "../ui/SafeImage";
import LikeButton from "../ui/LikeButton";
import { getTurmaColor } from "../ui/FilterBar";
import ProjetoModal from "./ProjetoModal";
import { getTechColor } from "../../data/technologies";
import { getInitials } from "../../utils/getInitials";
import { isSafeUrl } from "../../utils/isSafeUrl";
import "./ProjetoCard.css";

const MAX_TAGS = 3;
const MAX_AVATARS = 3;

function ProjetoCard({ project }) {
  const {
    id, title, description, course, turma, image, url, repoUrl,
    tags = [], members = [], likes = 0,
  } = project;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [liked, setLiked] = useState(false); // Estado unificado de like
  const cardRef = useSpotlight();

  const hasSite = url && isSafeUrl(url);
  const hasRepo = repoUrl && isSafeUrl(repoUrl);

  const turmaColor = getTurmaColor(turma);
  const accent = turmaColor || (tags[0] ? getTechColor(tags[0]) : undefined);
  const visibleTags = tags.slice(0, MAX_TAGS);
  const hiddenTagsCount = tags.length - visibleTags.length;
  const visibleMembers = members.slice(0, MAX_AVATARS);

  const handlePointerMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    card.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
    card.dataset.active = "true";
  };

  const handlePointerLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
    card.dataset.active = "false";
  };

  const openModal = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setDetailsOpen(true);
        });
      });
    } else {
      setDetailsOpen(true);
    }
  };

  const closeModal = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setDetailsOpen(false);
        });
      });
    } else {
      setDetailsOpen(false);
    }
  };

  const handleToggleLike = () => {
    setLiked((prev) => !prev);
  };

  return (
    <>
      <article
        ref={cardRef}
        className="project-card"
        data-active="false"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          "--card-accent": accent,
          "--turma-badge-color": turmaColor,
        }}
      >
        <div className="project-card__glow" aria-hidden="true" />

        <div
          className="project-card__cover"
          style={
            !detailsOpen && id
              ? { viewTransitionName: `project-cover-${id}` }
              : undefined
          }
        >
          <SafeImage
            src={image}
            alt={`Captura de tela do projeto ${title}`}
            loading="lazy"
            className="project-card__image"
            fallback={
              <>
                <span className="project-card__pattern" aria-hidden="true" />
                <span className="project-card__initial" aria-hidden="true">
                  {title.charAt(0)}
                </span>
              </>
            }
          />

          <span className="project-card__badge">
            <span className="project-card__badge-dot" aria-hidden="true" />
            <span className="visually-hidden">Turma </span>
            {turma}
          </span>
        </div>

        <div className="project-card__body">
          <p className="project-card__meta">{course}</p>

          <h3 className="project-card__title">
            {hasSite ? (
              <a
                href={url}
                className="project-card__link-area"
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
                <span className="project-card__arrow" aria-hidden="true">↗</span>
                <span className="visually-hidden"> (abre em nova aba)</span>
              </a>
            ) : (
              title
            )}
          </h3>

          <p className="project-card__description">{description}</p>

          <ul className="project-card__tags" aria-label="Tecnologias utilizadas">
            {visibleTags.map((tag) => (
              <li key={tag}>
                <Tag color={getTechColor(tag)}>{tag}</Tag>
              </li>
            ))}
            {hiddenTagsCount > 0 && (
              <li>
                <span
                  className="project-card__more"
                  aria-label={`e mais ${hiddenTagsCount} tecnologias`}
                >
                  +{hiddenTagsCount}
                </span>
              </li>
            )}
          </ul>

          <div className="project-card__footer">
            <div className="project-card__row">
              {members.length > 0 ? (
                <div className="project-card__team">
                  <ul className="project-card__avatars" aria-hidden="true">
                    {visibleMembers.map((member) => (
                      <li key={member.name} className="project-card__avatar">
                        {getInitials(member.name)}
                      </li>
                    ))}
                  </ul>
                  <span className="project-card__team-text">
                    {members.length} {members.length === 1 ? "integrante" : "integrantes"}
                  </span>
                </div>
              ) : (
                <span />
              )}

              <LikeButton
                count={likes + (liked ? 1 : 0)}
                liked={liked}
                onToggle={handleToggleLike}
                subject={title}
              />
            </div>

            <div className="project-card__actions">
              <Button
                variant="ghost"
                size="sm"
                aria-haspopup="dialog"
                onClick={openModal}
              >
                Saiba mais
                <span aria-hidden="true">&nbsp;→</span>
                <span className="visually-hidden"> sobre {title}</span>
              </Button>

              {hasRepo && (
                <a
                  href={repoUrl}
                  className="project-card__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Código<span className="visually-hidden"> de {title}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </article>

      {detailsOpen && (
        <ProjetoModal
          project={project}
          onClose={closeModal}
          liked={liked}
          onToggleLike={handleToggleLike}
        />
      )}
    </>
  );
}

export default ProjetoCard;