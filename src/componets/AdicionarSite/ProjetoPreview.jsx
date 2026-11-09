import { useMemo } from "react";
import ProjetoCard from "../Projetos/ProjetoCard";
import { isSafeUrl } from "../../utils/isSafeUrl";

// Mostra, em tempo real, como o projeto vai aparecer na página de projetos.
// Não cria um card novo: REAPROVEITA o ProjetoCard que já existe, só montando
// um objeto "project" com o mesmo formato que o card espera.
function ProjetoPreview({ valores }) {
  // useMemo: só refaz o objeto quando os valores mudam (evita trabalho à toa a cada render)
  const project = useMemo(() => {
    const site = valores.site_url.trim();
    const repo = valores.repo_url.trim();

    return {
      title: valores.titulo.trim() || "Título do seu projeto",
      description:
        valores.descricao.trim() ||
        "A descrição do seu projeto aparece aqui. Conte, em poucas linhas, o que ele faz e para quem.",
      course: "Informática",
      turma: valores.turma || "Turma",
      image: valores.imagem?.previewUrl ?? null, // a prévia local da imagem escolhida (ou o desenho padrão)
      url: isSafeUrl(site) ? site : undefined,
      repoUrl: isSafeUrl(repo) ? repo : undefined,
      tags: valores.tecnologias,
      members: valores.integrantes
        .filter((m) => m.nome.trim() !== "")
        .map((m) => ({ name: m.nome.trim(), role: m.funcao.trim() })),
      likes: 0,
    };
  }, [valores]);

  return (
    <aside className="add-site__preview" aria-label="Pré-visualização do seu projeto" inert>
      <p className="preview__label">
        <span className="preview__live" aria-hidden="true" />
        Pré-visualização ao vivo
      </p>
      <ProjetoCard project={project} />
      <p className="preview__note">
        É assim que o seu projeto aparecerá na página de projetos, depois de aprovado.
      </p>
    </aside>
  );
}

export default ProjetoPreview;