import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollManager() {
  // useLocation devolve o endereço atual e muda a cada navegação
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // Link com âncora (ex.: "/#projetos"): rola até o elemento com esse id
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    // Sem âncora: página nova começa no topo
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash, key]);

  return null; // não desenha nada, só executa o efeito
}

export default ScrollManager;