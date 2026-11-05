import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  // O valor inicial já vem correto, para não "piscar" na primeira renderização
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    media.addEventListener("change", update);
    update();

    // Limpeza: remove o "ouvinte" quando o componente sair da tela
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}