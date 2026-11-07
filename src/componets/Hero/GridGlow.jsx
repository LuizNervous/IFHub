import { useEffect, useRef } from "react";
import "./GridGlow.css";

const CELL = 56;
const RADIUS = 80;
const DECAY = 0.93;
const MAX_ALPHA = 0.5;

const SKY = [56, 189, 248];
const TEAL = [20, 184, 166];
const GREEN = [52, 211, 153];

function mix(a, b, t) {
  return a.map((value, i) => Math.round(value + (b[i] - value) * t));
}

function colorFor(intensity) {
  return intensity > 0.5
    ? mix(TEAL, SKY, (intensity - 0.5) * 2)
    : mix(GREEN, TEAL, intensity * 2);
}

function GridGlow() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const area = canvas?.parentElement;
    if (!canvas || !area) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let intensity = new Float32Array(0);
    let frameId = null;
    let ripples = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const value = intensity[row * cols + col];
          if (value <= 0) continue;

          const [r, g, b] = colorFor(value);
          const x = col * CELL;
          const y = row * CELL;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${value * MAX_ALPHA})`;
          ctx.fillRect(x + 1, y + 1, CELL - 1, CELL - 1);

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${value * 0.95})`;
          ctx.strokeRect(x + 1.5, y + 1.5, CELL - 2, CELL - 2);
        }
      }
    };

    const tick = () => {
      let alive = false;

      // 1. Ondas de choque em expansão (clique ou abertura)
      for (let r = ripples.length - 1; r >= 0; r--) {
        const ripple = ripples[r];
        ripple.radius += 10;
        const bandWidth = CELL * 1.4;

        const firstCol = Math.max(0, Math.floor((ripple.x - ripple.radius - bandWidth) / CELL));
        const lastCol = Math.min(cols - 1, Math.floor((ripple.x + ripple.radius + bandWidth) / CELL));
        const firstRow = Math.max(0, Math.floor((ripple.y - ripple.radius - bandWidth) / CELL));
        const lastRow = Math.min(rows - 1, Math.floor((ripple.y + ripple.radius + bandWidth) / CELL));

        for (let row = firstRow; row <= lastRow; row++) {
          for (let col = firstCol; col <= lastCol; col++) {
            const dist = Math.hypot(
              col * CELL + CELL / 2 - ripple.x,
              row * CELL + CELL / 2 - ripple.y
            );
            const diff = Math.abs(dist - ripple.radius);

            if (diff < bandWidth) {
              const fadeOut = 1 - ripple.radius / ripple.maxRadius;
              const strength = Math.min(1, (1 - diff / bandWidth) * fadeOut * 1.35);
              const index = row * cols + col;
              intensity[index] = Math.max(intensity[index], strength);
            }
          }
        }

        if (ripple.radius >= ripple.maxRadius) {
          ripples.splice(r, 1);
        } else {
          alive = true;
        }
      }

      // 2. Desvanece os quadrados
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
      frameId = alive ? requestAnimationFrame(tick) : null;
    };

    const startLoop = () => {
      if (frameId === null) frameId = requestAnimationFrame(tick);
    };

    const lightUp = (x, y, radius = RADIUS) => {
      const firstCol = Math.max(0, Math.floor((x - radius) / CELL));
      const lastCol = Math.min(cols - 1, Math.floor((x + radius) / CELL));
      const firstRow = Math.max(0, Math.floor((y - radius) / CELL));
      const lastRow = Math.min(rows - 1, Math.floor((y + radius) / CELL));

      for (let row = firstRow; row <= lastRow; row++) {
        for (let col = firstCol; col <= lastCol; col++) {
          const distance = Math.hypot(
            col * CELL + CELL / 2 - x,
            row * CELL + CELL / 2 - y
          );

          if (distance < radius) {
            const strength = Math.min(1, (1 - distance / radius) * 1.4);
            const index = row * cols + col;
            intensity[index] = Math.max(intensity[index], strength);
          }
        }
      }
    };

    const handlePointerMove = (event) => {
      const rect = area.getBoundingClientRect();
      lightUp(event.clientX - rect.left, event.clientY - rect.top);
      startLoop();
    };

    const handlePointerDown = (event) => {
      const rect = area.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      lightUp(x, y);
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.55,
      });
      startLoop();
    };

    let initialPulseDone = false;

    const resize = () => {
      const rect = area.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      intensity = new Float32Array(cols * rows);
      draw();

      // Dispara uma onda automática no centro ao abrir a página!
      if (!initialPulseDone && width > 0) {
        initialPulseDone = true;
        ripples.push({
          x: width / 2,
          y: height / 2,
          radius: 0,
          maxRadius: Math.max(width, height) * 0.5,
        });
        startLoop();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(area);

    area.addEventListener("pointermove", handlePointerMove);
    area.addEventListener("pointerdown", handlePointerDown);

    return () => {
      observer.disconnect();
      area.removeEventListener("pointermove", handlePointerMove);
      area.removeEventListener("pointerdown", handlePointerDown);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="grid-glow" aria-hidden="true" />;
}

export default GridGlow;