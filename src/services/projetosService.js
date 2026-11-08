import { supabase } from "../lib/supabase";

// Converte o formato do banco para o formato que seus componentes já usam
function paraProjeto(row) {
  return {
    id: row.id,
    title: row.titulo,
    description: row.descricao,
    course: row.curso,
    turma: row.turmas.nome,
    image: row.imagem_url,
    url: row.site_url,
    repoUrl: row.repo_url,
    advisor: row.orientador,
    likes: 0, // curtidas ficam para depois
    tags: row.projeto_tecnologias.map((pt) => pt.tecnologias.nome),
    members: row.integrantes.map((i) => ({ name: i.nome, role: i.funcao })),
    highlights: row.destaques.map((d) => d.texto),
  };
}

export async function listarProjetos() {
  const { data, error } = await supabase
    .from("projetos")
    .select(`
      *,
      turmas ( nome ),
      integrantes ( nome, funcao ),
      destaques ( texto ),
      projeto_tecnologias ( tecnologias ( nome ) )
    `)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data.map(paraProjeto);
}

export async function listarTurmas() {
  const { data, error } = await supabase
    .from("turmas")
    .select("nome")
    .order("nome");

  if (error) throw error;
  return data.map((t) => t.nome);
}
export async function obterEstatisticas() {
  const [projetos, turmas, tecnologias, integrantes] = await Promise.all([
    supabase.from("projetos").select("*", { count: "exact", head: true }),
    supabase.from("turmas").select("*", { count: "exact", head: true }),
    supabase.from("projeto_tecnologias").select("tecnologia_id"),
    supabase.from("integrantes").select("*", { count: "exact", head: true }),
  ]);

  const erro = projetos.error || turmas.error || tecnologias.error || integrantes.error;
  if (erro) throw erro;

  return {
    projetos: projetos.count,
    turmas: turmas.count,
    // Set remove repetidos: conta tecnologias distintas em uso
    tecnologias: new Set(tecnologias.data.map((t) => t.tecnologia_id)).size,
    integrantes: integrantes.count,
  };
}
export async function listarTecnologias() {
  const { data, error } = await supabase
    .from("tecnologias")
    .select("nome")
    .order("nome");

  if (error) throw error;
  return data.map((t) => t.nome);
}