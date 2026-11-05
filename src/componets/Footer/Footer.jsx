import "./Footer.css";
import Logo from "../ui/Logo";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <Logo />
        <p>Site desenvolvido para fins acadêmicos</p>
        <p>&copy; {new Date().getFullYear()} IFHub - Todos os direitos reservados. </p>
      </div>
    </footer>
  );
}

export default Footer;