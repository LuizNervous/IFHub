import { useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import Pagina from "./Pagina";
import {
  Sumario,
  FolhaRosto,
  CapOQueE,
  CapCriador,
  CapMantenedores,
  CapNumeros,
  CapComoFunciona,
  PaginaFinal,
} from "./Paginas";
import "./Sobre.css";

// Cada folha tem uma frente (página direita) e um verso (página esquerda).
// Guardamos COMPONENTES na lista: o React os desenha com <leaf.Front />.
const LEAVES = [
  { id: "folha-1", Front: FolhaRosto, frontNumber: null, Back: CapOQueE, backNumber: 2 },
  { id: "folha-2", Front: CapCriador, frontNumber: 3, Back: CapMantenedores, backNumber: 4 },
  { id: "folha-3", Front: CapNumeros, frontNumber: 5, Back: CapComoFunciona, backNumber: 6 },
];

const LAST_SPREAD = LEAVES.length; // 3: com 3 folhas viradas, chegamos ao fim

// "spread" = em qual par de páginas o sumário deve nos levar
const CHAPTERS = [
  { numeral: "I", title: "O que é o IFHub?", page: 2, spread: 1 },
  { numeral: "II", title: "Quem criou", page: 3, spread: 1 },
  { numeral: "III", title: "Quem mantém", page: 4, spread: 2 },
  { numeral: "IV", title: "Em números", page: 5, spread: 2 },
  { numeral: "V", title: "Como funciona", page: 6, spread: 3 },
];

function Sobre() {
  // O ÚNICO estado do livro: qual par de páginas está aberto (0 a 3)
  const [spread, setSpread] = useState(0);

  // true no celular/tablet pequeno: lá o livro vira uma lista de cards
  const isFlat = useMediaQuery("(max-width: 960px)");
  const isBook = !isFlat;

  // Garante que o número nunca saia do intervalo 0..LAST_SPREAD
  const goTo = (number) => setSpread(Math.min(LAST_SPREAD, Math.max(0, number)));
  const next = () => goTo(spread + 1);
  const prev = () => goTo(spread - 1);

  // Setas do teclado. O evento "borbulha" dos elementos internos até a seção.
  const handleKeyDown = (event) => {
    if (!isBook || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") prev();
  };

  return (
    <section
      id="sobre"
      className="sobre"
      aria-labelledby="sobre-title"
      onKeyDown={handleKeyDown}
    >
      <div className="sobre__container">
        <header className="sobre__header">
          <p className="sobre__eyebrow">Sobre o projeto</p>
          <h2 id="sobre-title" className="sobre__title">
            Um livro escrito pelos alunos
          </h2>
        </header>

        <div className="book-wrap">
          <div className="book">
            {/* Página fixa da esquerda: só aparece com o livro "fechado" no início */}
            <div className="book__half book__half--left">
              <Pagina side="left" inactive={isBook && spread !== 0}>
                <Sumario chapters={CHAPTERS} onSelect={goTo} />
              </Pagina>
            </div>

            {/* As folhas: cada uma decide sozinha se já foi virada */}
            {LEAVES.map((leaf, i) => {
              const flipped = i < spread;

              return (
                <div
                  key={leaf.id}
                  className={[
                    "leaf",
                    flipped ? "is-flipped" : "",
                    i === spread ? "is-next" : "",     // próxima a virar
                    i === spread - 1 ? "is-prev" : "", // última virada
                  ].join(" ")}
                  // Empilhamento: viradas ficam por cima na esquerda (ordem crescente),
                  // não viradas por cima na direita (ordem decrescente).
                  style={{ zIndex: flipped ? i + 1 : LEAVES.length - i }}
                >
                  <Pagina
                    side="right"
                    number={leaf.frontNumber}
                    inactive={isBook && i !== spread}
                  >
                    <leaf.Front />
                  </Pagina>

                  <Pagina
                    side="left"
                    number={leaf.backNumber}
                    inactive={isBook && i !== spread - 1}
                  >
                    <leaf.Back />
                  </Pagina>
                </div>
              );
            })}

            {/* Página fixa da direita: revelada quando todas as folhas viram */}
            <div className="book__half book__half--right">
              <Pagina side="right" number={7} inactive={isBook && spread !== LAST_SPREAD}>
                <PaginaFinal onRestart={() => goTo(0)} />
              </Pagina>
            </div>
          </div>
        </div>

        {/* Controles (escondidos no celular pelo CSS) */}
        <div className="sobre__controls">
          <button
            type="button"
            className="sobre__nav sobre__nav--prev"
            disabled={spread === 0}
            onClick={prev}
          >
            <span aria-hidden="true">←</span> Anterior
          </button>

          <div className="sobre__dots" role="group" aria-label="Ir para um par de páginas">
            {Array.from({ length: LAST_SPREAD + 1 }, (_, n) => (
              <button
                key={n}
                type="button"
                className={`sobre__dot ${n === spread ? "is-active" : ""}`}
                aria-label={`Páginas ${n + 1} de ${LAST_SPREAD + 1}`}
                aria-current={n === spread ? "true" : undefined}
                onClick={() => goTo(n)}
              />
            ))}
          </div>

          <button
            type="button"
            className="sobre__nav sobre__nav--next"
            disabled={spread === LAST_SPREAD}
            onClick={next}
          >
            Próxima <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Avisa leitores de tela sempre que o par de páginas muda */}
        <p className="visually-hidden" role="status">
          Páginas {spread + 1} de {LAST_SPREAD + 1}
        </p>

        <p className="sobre__hint">Dica: use as setas ← → do teclado</p>
      </div>
    </section>
  );
}

export default Sobre;