import { useEffect, useRef } from "react";
import "./GridGlow.css";

// ===== Configurações: mude aqui para ajustar o efeito =====
const CELL = 56;        // tamanho do quadrado em px (igual ao background-size da grade no Hero.css)
const RADIUS = 140;     // raio da área iluminada ao redor do cursor, em px
const DECAY = 0.93;     // quanto MENOR, mais rápido o quadrado apaga
const MAX_ALPHA = 0.42; // opacidade máxima do preenchimento (mantém o texto legível)

const SKY = [56, 189, 248];
const TEAL = [20, 184, 166];
const GREEN = [52, 211, 153];

// Mistura duas cores RGB. t = 0 devolve a), t = 1 devolve b).
function mix(a, b, t) {
  return a.map((value, i) => Math.round(value + (b[i] - value) * t));
}

// intensidade 1 = azul-claro, 0,5 = teal, perto de 0 = verde
function colorFor(intensity) {
  return intensity > 0.5
    ? mix(TEAL, SKY, (intensity - 0.5) * 2)
    : mix(GREEN, TEAL, intensity * 2);
}

function GridGlow() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const area = canvas?.parentElement; // a <section> do Hero
    if (!canvas || !area) return;

    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noHover = window.matchMedia("(hover: none)").matches; // celular/tablet

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let intensity = new Float32Array(0); // um número (0 a 1) por quadrado
    let frameId = null;
    let ambientId = null;

    // ----- Desenha todos os quadrados acesos -----
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const value = intensity[row * cols + col];
          if (value <= 0) continue; // apagado: não desenha

          const [r, g, b] = colorFor(value);
          const x = col * CELL;
          const y = row * CELL;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${value * MAX_ALPHA})`;
          ctx.fillRect(x + 1, y + 1, CELL - 1, CELL - 1);

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${value * 0.9})`;
          ctx.strokeRect(x + 1.5, y + 1.5, CELL - 2, CELL - 2);
        }
      }
    };

    // ----- Laço de animação: apaga aos poucos e redesenha -----
    const tick = () => {
      let alive = false;

      for (let i = 0; i < intensity.length; i++) {
        if (intensity[i] > 0) {
          intensity[i] *= DECAY;
          if (intensity[i] < 0.02) {
            intensity[i] = 0;
          } else {
            alive = true;
          }
        }
      }

      draw();
      // Se ainda há quadrados acesos, continua. Senão, o laço PARA.
      frameId = alive ? requestAnimationFrame(tick) : null;
    };

    const startLoop = () => {
      if (frameId === null) frameId = requestAnimationFrame(tick);
    };

    // ----- Acende os quadrados perto de um ponto (x, y) -----
    const lightUp = (x, y, radius = RADIUS) => {
      // Só percorremos os quadrados que podem estar no raio (e não a grade toda)
      const firstCol = Math.max(0, Math.floor((x - radius) / CELL));
      const lastCol = Math.min(cols - 1, Math.floor((x + radius) / CELL));
      const firstRow = Math.max(0, Math.floor((y - radius) / CELL));
      const lastRow = Math.min(rows - 1, Math.floor((y + radius) / CELL));

      for (let row = firstRow; row <= lastRow; row++) {
        for (let col = firstCol; col <= lastCol; col++) {
          // distância do centro do quadrado até o ponto
          const distance = Math.hypot(
            col * CELL + CELL / 2 - x,
            row * CELL + CELL / 2 - y
          );

          if (distance < radius) {
            // Quanto mais perto, mais forte. O "* 1.4" deixa o centro mais intenso.
            const strength = Math.min(1, (1 - distance / radius) * 1.4);
            const index = row * cols + col;
            // Math.max: nunca "apaga" um quadrado que já estava mais aceso
            intensity[index] = Math.max(intensity[index], strength);
          }
        }
      }
    };

    // ----- Eventos do ponteiro (mouse, caneta ou toque) -----
    const handlePointer = (event) => {
      const rect = area.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (reduceMotion) {
        // Sem rastro: só o que está sob o cursor, desenhado na hora
        intensity.fill(0);
        lightUp(x, y);
        draw();
      } else {
        lightUp(x, y);
        startLoop();
      }
    };

    const handleLeave = () => {
      if (reduceMotion) {
        intensity.fill(0);
        draw();
      }
      // Sem reduceMotion não precisa fazer nada: o fade apaga sozinho
    };

    // ----- Ajusta o canvas ao tamanho do Hero -----
    const resize = () => {
      const rect = area.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      // Telas de alta densidade (retina) precisam de mais pixels reais
      // para o desenho não ficar borrado.
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // deve vir DEPOIS de mudar width/height

      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      intensity = new Float32Array(cols * rows);
      draw();
    };

    // O ResizeObserver avisa quando o Hero muda de tamanho (e também uma vez
    // logo ao começar, então não precisamos chamar resize() à mão).
    const observer = new ResizeObserver(resize);
    observer.observe(area);

    // O canvas tem pointer-events: none, então ouvimos o Hero (o "pai").
    area.addEventListener("pointermove", handlePointer);
    area.addEventListener("pointerdown", handlePointer);
    area.addEventListener("pointerleave", handleLeave);

    // Alternativa para telas sem mouse: quadrados acendem sozinhos, devagar
    if (noHover && !reduceMotion) {
      ambientId = setInterval(() => {
        lightUp(Math.random() * width, Math.random() * height, CELL * 1.3);
        startLoop();
      }, 450);
    }

    // Limpeza: remove tudo quando o componente sair da tela
    return () => {
      observer.disconnect();
      area.removeEventListener("pointermove", handlePointer);
      area.removeEventListener("pointerdown", handlePointer);
      area.removeEventListener("pointerleave", handleLeave);
      if (frameId !== null) cancelAnimationFrame(frameId);
      if (ambientId !== null) clearInterval(ambientId);
    };
  }, []);

  return <canvas ref={canvasRef} className="grid-glow" aria-hidden="true" />;
}

export default GridGlow;