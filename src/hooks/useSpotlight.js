import { useEffect, useRef } from "react";

export function useSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return

    const reduceMotion = window.matchMedia("(preferes-reduced-motion: reduce)");

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frameId = null;

    const render = () => {
      const ease = reduceMotion.matches ? 1 : 0.15;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;

      element.style.setProperty("--mouse-x", `${current.x}px`);
      element.style.setProperty("--mouse-y", `${current.y}px`);

      const distance = Math.abs(target.x - current.x) + Math.abs(target.y - current.y);
      frameId = distance > 0.1 ? requestAnimationFrame(render) : null;
    };

    const startLoop = () => {
      if (frameId === null) frameId = requestAnimationFrame(render);
    };

    const updateTarget = (event) => {
      const rect = element.getBoundingClientRect();
      target.x = event.clientX - rect.left;
      target.y = event.clientY - rect.top;
    };

    const handleEnter = (event) => {
      if (event.pointerType === "touch") return;
      updateTarget(event);
      // Na entrada, a luz já nasce no cursor (não "voa" de outro lugar)
      current.x = target.x;
      current.y = target.y;
      element.dataset.active = "true";
      startLoop();
    };

    const handleMove = (event) => {
      if (event.pointerType === "touch") return;
      updateTarget(event);
      startLoop();
    };

    const handleLeave = () => {
      element.dataset.active = "false"; // o CSS faz o fade-out
    };

    element.addEventListener("pointerenter", handleEnter);
    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);

    // Limpeza: remove tudo quando o componente sair da tela
    return () => {
      element.removeEventListener("pointerenter", handleEnter);
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  return ref;
}