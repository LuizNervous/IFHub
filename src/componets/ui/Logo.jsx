import { Link } from "react-router-dom";
import "./Logo.css";

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="IFHub, página inicial">
      <span className="logo__mark" aria-hidden="true" />
      <span className="logo__text">
        IF<span className="logo__accent">Hub</span>
      </span>
    </Link>
  );
}

export default Logo;