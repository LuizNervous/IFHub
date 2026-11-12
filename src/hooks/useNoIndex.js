import { useEffect } from "react";

// Pede aos buscadores (Google etc.) para NÃO indexar esta página enquanto ela estiver aberta.
// (Não é segurança, é só higiene: a proteção real está no banco.)
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}