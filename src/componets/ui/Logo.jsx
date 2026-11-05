import "./Logo.css";

function Logo() {


  return  (
    <a href="#inicio" className="logo" aria-label="IFHub, página inicial">
      <span className="logo__mark" aria-hidden="true" />
      <span className="logo__text">
        IF<span className="logo__accent">Hub</span>
      </span>
    </a>
  )
}
 export default Logo;