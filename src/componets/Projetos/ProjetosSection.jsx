import { useEffect, useState } from "react";
import { listarProjetos, listarTurmas } from "../../services/projetosService";
import FilterBar from "../ui/FilterBar";
import ProjetoCard from "./ProjetoCard";
import "./ProjetosSection.css";
import { projects as fallbackProjects, TURMAS as fallbackTurmas } from "../../data/sites";

const ALL = "Todos";

function ProjetosSection() {
  const [projects, setProjects] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "error" | "ready"
  const [selectedTurma, setSelectedTurma] = useState(ALL);

  useEffect(() => {
    let cancelado = false; // evita atualizar estado se o componente sumiu

    async function carregar() {
      try {
        const [listaProjetos, listaTurmas] = await Promise.all([
          listarProjetos(),
          listarTurmas(),
        ]);
        if (cancelado) return;

        // 2. Se tiver projetos no banco, usa os do banco. Se vier vazio (0), usa o sites.js
        const temProjetosNoBanco = listaProjetos && listaProjetos.length > 0;
        setProjects(temProjetosNoBanco ? listaProjetos : fallbackProjects);

        // Faz o mesmo para as turmas
        const temTurmasNoBanco = listaTurmas && listaTurmas.length > 0;
        setTurmas(temTurmasNoBanco ? listaTurmas : fallbackTurmas);

        setStatus("ready");
      } catch (err) {
        console.warn("Erro ao buscar do banco, usando dados locais de teste:", err);
        if (!cancelado) {
          setProjects(fallbackProjects);
          setTurmas(fallbackTurmas);
          setStatus("ready");
        }
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  const filterOptions = [ALL, ...turmas];
  const visibleProjects =
    selectedTurma === ALL
      ? projects
      : projects.filter((project) => project.turma === selectedTurma);
  const count = visibleProjects.length;

  return (
    <section id="projetos" className="projects" aria-labelledby="projects-title">
      <div className="projects__container">
        <header className="projects__header">
          <div className="projects__filter">
            <FilterBar
              label="Filtrar projetos por turma"
              options={filterOptions}
              value={selectedTurma}
              onChange={setSelectedTurma}
            />
          </div>

          <h2 id="projects-title" className="projects__title">
            Projetos Finais de Curso / Projetos
          </h2>
          <p className="projects__intro">
            Trabalhos desenvolvidos pelos alunos do curso de Informática,
            reunidos em um só lugar.
          </p>
        </header>

        {/* Avisa leitores de tela quando o filtro muda a lista */}
        {status === "ready" && (
          <p className="visually-hidden" role="status">
            {count} {count === 1 ? "projeto exibido" : "projetos exibidos"}
          </p>
        )}
        {status === "loading" && <p className="projects__empty">Carregando projetos…</p>}
        {status === "error" && (
          <p className="projects__empty" role="alert">
            Não foi possível carregar os projetos. Tente novamente mais tarde.
          </p>
        )}
        {status === "ready" &&
          (count === 0 ? (
            <p className="projects__empty">
              {selectedTurma === ALL
                ? "Nenhum projeto cadastrado ainda."
                : `Nenhum projeto da turma ${selectedTurma} cadastrado ainda.`}
            </p>
          ) : (
            <ul className="projects__grid">
              {visibleProjects.map((project) => (
                <li key={project.id}>
                  <ProjetoCard project={project} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </section>
  );
}

export default ProjetosSection;