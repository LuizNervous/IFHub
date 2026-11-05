// Turmas disponíveis no filtro (na ordem em que aparecem).
// IIW26 pode ficar sem projetos: a tela mostra uma mensagem amigável.
export const TURMAS = ["IIW24", "IIW25", "IIW26"];

// DADOS DE EXEMPLO. No futuro, esta lista virá do backend com o mesmo formato.
export const projects = [
  {
    id: 1,
    title: "Sistema de Gestão Escolar",
    description:
      "Plataforma web para controle de turmas, notas e frequência, pensada para a rotina de professores e coordenação.",
    course: "Informática",
    turma: "IIW24",
    tags: ["React", "Node.js", "PostgreSQL"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFDtQYSGyyJRcQF6lx66F09NUKDi7ni6aLs-Mnxr-Oqw&s=10",
    url: "https://example.com/projeto-1",
    repoUrl: "https://github.com/exemplo/projeto-1",
    likes: 24,
    advisor: "Prof. Carlos Almeida",
    members: [
      { name: "Ana Beatriz Souza", role: "Front-end e design" },
      { name: "Lucas Ferreira", role: "Back-end" },
      { name: "Mariana Costa", role: "Banco de dados e testes" },
    ],
    highlights: [
      "Testado com dados simulados de 3 turmas inteiras",
      "Gera boletins em PDF com um clique",
      "Apresentado na Mostra de Projetos do campus",
    ],
  },
  {
    id: 2,
    title: "App de Reciclagem Inteligente",
    description:
      "Aplicativo que ensina a separar resíduos corretamente e mostra pontos de coleta próximos.",
    course: "Informática",
    turma: "IIW24",
    tags: ["React Native", "Firebase"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBn_BvGj1aDMl0p_zQlMXVEPnkmgb0fGT6JIKoaqEWpQ&s=10",
    url: "https://example.com/projeto-2",
    repoUrl: null, // sem repositório público: o card lida com isso
    likes: 24,
    advisor: "Profa. Renata Oliveira",
    members: [
      { name: "Pedro Henrique Lima", role: "Aplicativo mobile" },
      { name: "Júlia Martins", role: "Design e conteúdo" },
    ],
    highlights: [
      "Dicas de descarte funcionam sem internet",
      "Mapa com pontos de coleta da região",
    ],
  },
  {
    id: 3,
    title: "Portal de Eventos do Campus",
    description:
      "Site para divulgar e organizar eventos acadêmicos, com agenda e inscrição online.",
    course: "Informática",
    turma: "IIW25",
    tags: ["HTML", "CSS", "JavaScript", "PHP", "MySQL"],
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWnXJhTFKyBHApg0RwOwtDOQHjIJCyIox0muZFFI0x5A&s=10',
    url: "https://example.com/projeto-3",
    repoUrl: "https://github.com/exemplo/projeto-3",
    likes: 24,
    advisor: "Prof. Marcos Tavares",
    members: [
      { name: "Gabriel Rocha", role: "Back-end em PHP" },
      { name: "Larissa Pinto", role: "Interface" },
      { name: "Thiago Nunes", role: "Banco de dados" },
    ],
    highlights: [
      "Inscrição com confirmação automática por e-mail",
      "Agenda que se adapta a qualquer tela",
    ],
  },
  {
    id: 4,
    title: "Monitor de Estufa com IoT",
    description:
      "Protótipo que mede temperatura e umidade e envia alertas, usando microcontrolador e painel web.",
    course: "Informática",
    turma: "IIW25",
    tags: ["Arduino", "Python", "MQTT"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-b52mxUCJ_Qif72T5Ohkuts89BG9SkUck8qvFDhwk0g&s=10",
    url: null, // sem site: o card não é clicável, mas "Saiba mais" funciona
    repoUrl: "https://github.com/exemplo/projeto-4",
    likes: 24,
    advisor: "Prof. Carlos Almeida",
    members: [
      { name: "Rafael Gomes", role: "Eletrônica e Arduino" },
      { name: "Camila Duarte", role: "Painel e alertas" },
    ],
    highlights: [
      "Protótipo montado com sensores de baixo custo",
      "Alerta automático quando a temperatura passa do limite",
    ],
  },
  {
    id: 5,
    title: "Biblioteca Digital Colaborativa",
    description:
      "Acervo online de materiais de estudo com busca, categorias e avaliação pelos próprios alunos.",
    course: "Informática",
    turma: "IIW26",
    tags: ["Vue", "Laravel", "MySQL"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpioDWoMfflBMRTw_tBo65p_7ApVcsT2rfuppz4uPAww&s=10",
    url: "https://example.com/projeto-5",
    repoUrl: "https://github.com/exemplo/projeto-5",
    likes: 24,
    advisor: "Profa. Renata Oliveira",
    members: [
      { name: "Beatriz Andrade", role: "Front-end" },
      { name: "Vinícius Prado", role: "API em Laravel" },
      { name: "Isabela Moura", role: "Curadoria do acervo" },
    ],
    highlights: [
      "Busca por título, autor ou assunto",
      "Alunos avaliam e recomendam materiais",
    ],
  },
  {
    id: 6,
    title: "Jogo Educativo de Lógica",
    description:
      "Jogo com fases que ensinam raciocínio lógico e algoritmos para estudantes do ensino fundamental.",
    course: "Informática",
    turma: "IIW26",
    tags: ["JavaScript", "Canvas", "HTML", "CSS"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkGi2KUbNH3y5KT5qx5UKuLCUfKpqQF1u1dI_akrIB4g&s=10",
    url: "https://example.com/projeto-6",
    repoUrl: null,
    likes: 24,
    advisor: "Prof. Marcos Tavares",
    members: [
      { name: "Eduardo Silveira", role: "Programação do jogo" },
      { name: "Fernanda Lopes", role: "Arte e fases" },
    ],
    highlights: [
      "12 fases com dificuldade crescente",
      "Feito inteiramente sem bibliotecas externas",
    ],
  },
];