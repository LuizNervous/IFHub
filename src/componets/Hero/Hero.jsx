import { useState, useEffect, useCallback } from "react";
import Button from "../ui/Button";
import GridGlow from "./GridGlow";
import "./Hero.css";

const CHARS = "01#$%&*<>/_+=";
const SUBTITLE_TEXT = "Repositório de todos os sites e projetos do curso de Informática";

function Hero() {
  const [text, setText] = useState(SUBTITLE_TEXT);

  const triggerScramble = useCallback(() => {
    let frameId;
    const duration = 1600; // 1.6 segundos para ficar bem visível
    const startTime = performance.now();

    const update = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const revealCount = Math.floor(progress * SUBTITLE_TEXT.length);

      let output = "";
      for (let i = 0; i < SUBTITLE_TEXT.length; i++) {
        if (SUBTITLE_TEXT[i] === " ") {
          output += " ";
        } else if (i < revealCount) {
          output += SUBTITLE_TEXT[i];
        } else {
          output += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      setText(output);
      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const cleanup = triggerScramble();
    return cleanup;
  }, [triggerScramble]);

  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true" />
      <GridGlow />

      <div className="hero__content">
        <h1 id="hero-title" className="hero__title">
          IF<span className="hero__title-accent">Hub</span>
        </h1>

        <p
          className="hero__subtitle"
          onMouseEnter={triggerScramble}
          title="Passe o mouse para descodificar novamente"
        >
          {text}
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