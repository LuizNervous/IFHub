import { useState } from "react";
import { useSpotlight } from "../../hooks/useSpotlight";
import Tag from "../ui/Tag";
import Button from "../ui/Button";
import SafeImage from "../ui/SafeImage";
import LikeButton from "../ui/LikeButton";
import ProjetoModal from "./ProjetoModal";
import { getTechColor } from "../../data/technologies";
import { getInitials } from "../../utils/getInitials";
import { isSafeUrl } from "../../utils/isSafeUrl";
import "./ProjetoCard.css";

const MAX_TAGS = 3;
const MAX_AVATARS = 3;

function ProjetoCard({ project }) {
  const {
    title, description, course, turma, image, url, repoUrl,
    tags = [], members = [], likes = 0,
  } = project;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const cardRef = useSpotlight();

  const hasSite = url && isSafeUrl(url);
  const hasRepo = repoUrl && isSafeUrl(repoUrl);

  const accent = tags[0] ? getTechColor(tags[0]) : undefined;
  const visibleTags = tags.slice(0, MAX_TAGS);
  const hiddenTagsCount = tags.length - visibleTags.length;
  const visibleMembers = members.slice(0, MAX_AVATARS);

  return (
    <>
      <article
        ref={cardRef}
        className="project-card"
        data-active="false"
        style={accent ? { "--card-accent": accent } : undefined}
      >
        <div className="project-card__glow" aria-hidden="true" />

        <div className="project-card__cover">
          {/* Se a imagem faltar ou falhar, o fallback (grade + inicial) aparece */}
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

              {/* Sem onToggle: apenas visual, por enquanto */}
              <LikeButton count={likes} subject={title} />
            </div>

            <div className="project-card__actions">
              <Button
                variant="ghost"
                size="sm"
                aria-haspopup="dialog"
                onClick={() => setDetailsOpen(true)}
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
        <ProjetoModal project={project} onClose={() => setDetailsOpen(false)} />
      )}
    </>
  );
}

export default ProjetoCard;