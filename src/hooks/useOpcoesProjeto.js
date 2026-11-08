import { useEffect, useState } from "react";
import { listarTurmas, listarTecnologias } from "../services/projetosService";

// Carrega as listas FECHADAS que o formulário oferece (turmas e tecnologias).
// O servidor só aceita valores que existem nessas listas.
export function useOpcoesProjeto() {
  const [opcoes, setOpcoes] = useState({ turmas: [], tecnologias: [], status: "loading" });

  useEffect(() => {
    let cancelado = false;

    Promise.all([listarTurmas(), listarTecnologias()])
      .then(([turmas, tecnologias]) => {
        if (!cancelado) setOpcoes({ turmas, tecnologias, status: "ready" });
      })
      .catch(() => {
        if (!cancelado) setOpcoes({ turmas: [], tecnologias: [], status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return opcoes;
}