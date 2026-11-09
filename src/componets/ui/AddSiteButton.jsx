import { Link } from "react-router-dom";
import "./AddSiteButton.css";

// O botão de chamada para ação (CTA) "Adicione seu site". Existe em duas variantes:
//   "nav"   -> para o header: escuro, com uma borda de luz que gira (discreto, mas chama o olhar);
//   "large" -> para a seção de projetos: preenchido em verde, com um brilho que atravessa o botão.
// Os dois levam para a mesma página. Todo o resto (...rest) vai para o <Link>, como onClick.
function AddSiteButton({ variant = "nav", children = "Adicione seu site", ...rest }) {
  return (
    <Link to="/adicionar-site" className={`cta cta--${variant}`} {...rest}>
      <span className="cta__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="cta__label">{children}</span>
      {variant === "large" && (
        <span className="cta__arrow" aria-hidden="true">
          →
        </span>
      )}
    </Link>
  );
}

export default AddSiteButton;