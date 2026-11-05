import { Link } from "react-router-dom";
import "./Button.css";

// to   -> navegação interna (Link do roteador, sem recarregar)
// href -> link externo ou âncora comum (<a>)
// nenhum dos dois -> <button> de verdade
function Button({ to, href, variant = "primary", size = "md", children, ...rest }) {
  const className = `button button--${variant} button--${size}`;

  if (to) {
    return (
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={className} {...rest}>
      {children}
    </button>
  );
}

export default Button;