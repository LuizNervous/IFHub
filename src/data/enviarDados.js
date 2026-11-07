import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://qnaqyeihjooedukpuyas.supabase.co', 'sb_publishable_18LV_9FK--MmlJqfIPXaEg_uZDZ0fSR')

async function inserirProjeto() {
  const { data, error } = await supabase
    .from('projetos') // Nome da sua tabela
    .insert([
      {
        // Opcional: remova o "id: 1" se quiser que o banco gere o ID automaticamente
        id: 1,
        title: "Titulo Teste",
        description: "Site teste para demonstrar o funcionamento do IFHub. Este projeto é apenas um exemplo, não é real.",
        course: "Informática",
        turma: "IIW24",
        tags: ["React", "Node.js", "PostgreSQL"],
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzSp9jFKM44ehM_FHSQT9WkkRq1AvIPJIESl4D8te0EA&s=10",
        url: "https://example.com/projeto-1",
        repoUrl: "https://github.com/exemplo/projeto-1",
        likes: 24,
        advisor: "Prof. Carlos Almeida Teste",
        members: [
          { name: "Ana Beatriz Souza Teste", role: "Front-end e design" },
          { name: "Lucas Ferreira Teste", role: "Back-end" },
          { name: "Mariana Costa Teste", role: "Banco de dados e testes" }
        ],
        highlights: [
          "Testado com  TEste de dados simulados de 3 turmas inteiras",
          "Teste gera boletins em PDF com um clique",
          "Teste apresentado na Mostra de Projetos do campus"
        ]
      }
    ])
    .select()

  if (error) {
    console.error('Erro ao inserir:', error)
  } else {
    console.log('Projeto inserido com sucesso:', data)
  }
}

inserirProjeto()