// ProjetosSection.jsx
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { listarProjetos, listarTurmas } from "../../services/projetosService";
import FilterBar from "../ui/FilterBar";
import AddSiteButton from "../ui/AddSiteButton";
import ProjetoCard from "./ProjetoCard";
import AddSiteCard from "./AddSiteCard";
import "./ProjetosSection.css";
import { projects as fallbackProjects, TURMAS as fallbackTurmas } from "../../data/sites";

const ALL = "Todos";

function ProjetosSection() {
  const [projects, setProjects] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "error" | "ready"
  const [selectedTurma, setSelectedTurma] = useState(ALL);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const [listaProjetos, listaTurmas] = await Promise.all([
          listarProjetos(),
          listarTurmas(),
        ]);
        if (cancelado) return;

        const temProjetosNoBanco = listaProjetos && listaProjetos.length > 0;
        setProjects(temProjetosNoBanco ? listaProjetos : fallbackProjects);

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

  const handleSelectTurma = (novaTurma) => {
    if (novaTurma === selectedTurma) return;

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setSelectedTurma(novaTurma);
        });
      });
    } else {
      setSelectedTurma(novaTurma);
    }
  };

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
              onChange={handleSelectTurma}
            />
          </div>

          <h2 id="projects-title" className="projects__title">
            Projetos Finais de Curso / Projetos
          </h2>
          <p className="projects__intro">
            Trabalhos desenvolvidos pelos alunos do curso de Informática,
            reunidos em um só lugar.
          </p>

          <div className="projects__cta">
            <AddSiteButton variant="large" />
            <span className="projects__cta-hint">
              Leva poucos minutos · revisado por um administrador
            </span>
          </div>
        </header>

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
            <div className="projects__empty">
              <p>
                {selectedTurma === ALL
                  ? "Nenhum projeto cadastrado ainda."
                  : `Nenhum projeto da turma ${selectedTurma} cadastrado ainda.`}
              </p>
              <AddSiteButton variant="large">Seja o primeiro a adicionar</AddSiteButton>
            </div>
          ) : (
            <ul className="projects__grid">
              {/* Um <li> por projeto. Cada <li> contém UM card, e só um. */}
              {visibleProjects.map((project, index) => (
                <li
                  key={`${selectedTurma}-${project.id}`}
                  className="projects__grid-item"
                  style={{
                    "--card-index": index,
                    viewTransitionName: `project-item-${project.id}`,
                  }}
                >
                  <ProjetoCard project={project} />
                </li>
              ))}

              {/* O card-convite é o ÚLTIMO <li> da grade: um item irmão dos projetos, não filho de um deles. */}
              <li className="projects__grid-item" style={{ "--card-index": count }}>
                <AddSiteCard />
              </li>
            </ul>
          ))}
      </div>
    </section>
  );
}

export default ProjetosSection;