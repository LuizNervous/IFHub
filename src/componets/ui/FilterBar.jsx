import { useEffect, useRef, useState } from "react";
import "./FilterBar.css";

// Mapa de cores por turma (podes importar esta função noutros ficheiros também!)
export function getTurmaColor(turma = "") {
  const key = String(turma).toUpperCase().trim();
  const colors = {
    TODOS: "var(--color-teal, #14b8a6)",
    IIW24: "#38bdf8", // Azul Sky
    IIW25: "#4ade80", // Verde Neon
    IIW26: "#a855f7", // Roxo/Violeta
    IIW27: "#f59e0b", // Laranja/Âmbar
  };
  return colors[key] || "var(--color-teal, #14b8a6)";
}

function FilterBar({ label, options, value, onChange }) {
  const barRef = useRef(null);
  const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const updatePill = () => {
      const activeBtn = bar.querySelector(".filter-bar__item.is-active");
      if (activeBtn) {
        setPill({
          left: activeBtn.offsetLeft,
          top: activeBtn.offsetTop,
          width: activeBtn.offsetWidth,
          height: activeBtn.offsetHeight,
          opacity: 1,
        });
      }
    };

    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [value, options]);

  const activeColor = getTurmaColor(value);

  return (
    <div
      ref={barRef}
      className="filter-bar"
      role="group"
      aria-label={label}
      style={{ "--active-turma-color": activeColor }}
    >
      <span
        className="filter-bar__pill"
        style={{
          transform: `translate(${pill.left}px, ${pill.top}px)`,
          width: `${pill.width}px`,
          height: `${pill.height}px`,
          opacity: pill.opacity,
        }}
        aria-hidden="true"
      />

      {options.map((option) => {
        const isActive = option === value;
        const optionColor = getTurmaColor(option);

        return (
          <button
            key={option}
            type="button"
            className={`filter-bar__item ${isActive ? "is-active" : ""}`}
            style={{ "--turma-color": optionColor }}
            aria-pressed={isActive}
            onClick={() => onChange(option)}
          >
            <span className="filter-bar__dot" aria-hidden="true" />
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default FilterBar;