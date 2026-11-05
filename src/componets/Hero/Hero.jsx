import Button from "../ui/Button";
import GridGlow from "./GridGlow";
import "./Hero.css";

function Hero() {
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      {/* Camadas decorativas, de trás para frente */}
      <div className="hero__grid" aria-hidden="true" />
      <GridGlow />

      <div className="hero__content">
        <h1 id="hero-title" className="hero__title">
          IF<span className="hero__title-accent">Hub</span>
        </h1>

        <p className="hero__subtitle">
          Repositório de todos os sites e projetos do curso de Informática
          <br />
          Campus Assis Chateaubriand · PR
        </p>

        <div className="hero__actions">
          <Button to="/#projetos" variant="primary">Explorar projetos</Button>
          <Button to="/sobre" variant="ghost">Saiba mais</Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;