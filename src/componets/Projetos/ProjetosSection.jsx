import { useState } from "react";
import { projects, TURMAS } from "../../data/sites";
import FilterBar from "../ui/FilterBar";
import ProjetoCard from "./ProjetoCard";
import "./ProjetosSection.css";

const ALL = "Todos";
const FILTER_OPTIONS = [ALL, ...TURMAS]; // ["Todos", "IIW24", "IIW25", "IIW26"]

function ProjetosSection() {
  // Único estado: qual turma está selecionada
  const [selectedTurma, setSelectedTurma] = useState(ALL);

  // Estado derivado: calculado a cada renderização, não guardado em useState
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
              options={FILTER_OPTIONS}
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
        <p className="visually-hidden" role="status">
          {count} {count === 1 ? "projeto exibido" : "projetos exibidos"}
        </p>

        {count === 0 ? (
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
        )}
      </div>
    </section>
  );
}

export default ProjetosSection;