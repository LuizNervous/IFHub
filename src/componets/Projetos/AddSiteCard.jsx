import { Link } from "react-router-dom";
import "./AddSiteCard.css";

// Um "espaço vazio" no fim da grade de projetos, convidando o visitante a ocupá-lo.
// Visualmente parece um card de projeto sem preenchimento, então a ideia fica imediata.
function AddSiteCard() {
  return (
    <Link to="/adicionar-site" className="add-card">
      <span className="add-card__plus" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="add-card__title">O próximo projeto pode ser o seu</span>
      <span className="add-card__text">
        Cadastre seu site, mostre seu trabalho para todo o campus e inspire quem vem depois.
      </span>
      <span className="add-card__action">
        Adicionar meu projeto <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export default AddSiteCard;