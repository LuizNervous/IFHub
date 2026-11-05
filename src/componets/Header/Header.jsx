import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import "./Header.css";

const NAV_ITEMS = [
  { label: "Início", to: "/" },
  { label: "Projetos", to: "/#projetos" },
  { label: "Sobre", to: "/sobre" },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header__container">
        <Logo />

        <button
          type="button"
          className="header__toggle"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="header__toggle-bar" />
          <span className="header__toggle-bar" />
          <span className="header__toggle-bar" />
        </button>

        <div id="main-nav" className={`header__menu ${menuOpen ? "is-open" : ""}`}>
          <nav aria-label="Navegação principal">
            <ul className="header__list">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="header__link" onClick={closeMenu}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__actions">
            <Button href="#admin" variant="ghost">Área restrita</Button>
            <Button to="/#projetos" variant="primary">Explorar projetos</Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;