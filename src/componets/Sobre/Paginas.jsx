import { projects, TURMAS } from "../../data/sites";
import Button from "../ui/Button";
import Tag from "../ui/Tag";

/* ---------- Peça reutilizável: cabeçalho de capítulo ---------- */
function Capitulo({ numeral, title, children }) {
  return (
    <>
      <p className="page__kicker">Capítulo {numeral}</p>
      <h3 className="page__title">{title}</h3>
      <div className="page__text">{children}</div>
    </>
  );
}

/* ---------- Spread 0, esquerda: Sumário ---------- */
export function Sumario({ chapters, onSelect }) {
  return (
    <>
      <p className="page__kicker">Antes de começar</p>
      <h3 className="page__title">Sumário</h3>

      <ol className="toc">
        {chapters.map((chapter) => (
          <li key={chapter.numeral}>
            {/* onSelect é uma função que vem do pai (Sobre.jsx) */}
            <button
              type="button"
              className="toc__item"
              onClick={() => onSelect(chapter.spread)}
            >
              <span className="toc__numeral">{chapter.numeral}</span>
              <span className="toc__name">{chapter.title}</span>
              <span className="toc__dots" aria-hidden="true" />
              <span className="toc__page">{chapter.page}</span>
            </button>
          </li>
        ))}
      </ol>

      <p className="page__note">Clique em um capítulo para ir direto a ele.</p>
    </>
  );
}

/* ---------- Spread 0, direita: Folha de rosto ---------- */
export function FolhaRosto() {
  return (
    <div className="cover">
      <p className="page__kicker">Projeto Final de Curso · IFPR</p>
      <span className="cover__mark" aria-hidden="true" />
      <p className="cover__title">
        IF<span>Hub</span>
      </p>
      <p className="cover__subtitle">O livro aberto dos projetos de Informática</p>
      <span className="cover__rule" aria-hidden="true" />
      <p className="cover__campus">Campus Assis Chateaubriand · Paraná</p>
      <p className="cover__hint">Vire a página →</p>
    </div>
  );
}

/* ---------- Spread 1, esquerda: Cap. I ---------- */
export function CapOQueE() {
  return (
    <Capitulo numeral="I" title="O que é o IFHub?">
      <p className="page__lead">
        O IFHub é um repositório que reúne, em um só lugar, os sites e sistemas
        desenvolvidos pelos alunos do curso de Informática do IFPR, Campus Assis
        Chateaubriand.
      </p>
      <p>
        Cada Projeto Final de Curso carrega meses de estudo, tentativa e erro.
        Aqui, esses trabalhos deixam de ficar esquecidos em pastas e passam a ser
        vistos, visitados e usados como inspiração para quem vem depois.
      </p>
    </Capitulo>
  );
}

/* ---------- Spread 1, direita: Cap. II ---------- */
export function CapCriador() {
  return (
    <Capitulo numeral="II" title="Quem criou">
      <div className="author">
        <span className="author__avatar" aria-hidden="true">LG</span>
        <div>
          <p className="author__name">Luiz Gustavo</p>
          <p className="author__role">Aluno do IFPR · Campus Assis Chateaubriand</p>
        </div>
      </div>

      <p className="page__lead">
        O IFHub foi idealizado e desenvolvido por Luiz Gustavo, aluno do
        Instituto Federal do Paraná.
      </p>
      <p>
        Construir o site foi também uma forma de aprender: cada componente, cada
        detalhe de interface e cada linha de código fazem parte da jornada.
      </p>
    </Capitulo>
  );
}

/* ---------- Spread 2, esquerda: Cap. III ---------- */
export function CapMantenedores() {
  return (
    <Capitulo numeral="III" title="Quem mantém">
      <p className="page__lead">
        O IFHub será mantido pelos próprios alunos do IFPR.
      </p>
      <p>
        A ideia é que o site continue vivo: turma após turma, novos projetos
        entram na estante e a história do curso continua sendo escrita por quem
        a vive.
      </p>

      <ul className="chips">
        {["Feito por alunos", "Mantido por alunos", "Para os alunos"].map((text) => (
          <li key={text}>
            {/* Reaproveitando o Tag, passando uma cor da nossa paleta */}
            <Tag color="var(--color-teal)">{text}</Tag>
          </li>
        ))}
      </ul>
    </Capitulo>
  );
}

/* ---------- Spread 2, direita: Cap. IV ---------- */
export function CapNumeros() {
  // Valores DERIVADOS dos dados: quando um projeto novo entra em sites.js,
  // estes números se atualizam sozinhos.
  const stats = [
    { label: "Projetos", value: projects.length },
    { label: "Turmas", value: TURMAS.length },
    // Set remove repetidos: conta tecnologias únicas
    { label: "Tecnologias", value: new Set(projects.flatMap((p) => p.tags)).size },
    {
      label: "Integrantes",
      value: projects.reduce((total, p) => total + (p.members?.length ?? 0), 0),
    },
  ];

  return (
    <Capitulo numeral="IV" title="Em números">
      <p>O acervo hoje, contado direto dos dados do site:</p>

      <dl className="stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stats__item">
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </Capitulo>
  );
}

/* ---------- Spread 3, esquerda: Cap. V ---------- */
const STEPS = [
  { title: "Escolha a turma", text: "Use o filtro para ver os projetos de cada ano." },
  { title: "Conheça o projeto", text: "Em “Saiba mais”, veja integrantes e destaques." },
  { title: "Visite o site", text: "Clique no card para abrir o projeto de verdade." },
];

export function CapComoFunciona() {
  return (
    <Capitulo numeral="V" title="Como funciona">
      <ol className="steps">
        {STEPS.map((step, index) => (
          <li key={step.title} className="steps__item">
            <span className="steps__num" aria-hidden="true">{index + 1}</span>
            <div>
              <p className="steps__title">{step.title}</p>
              <p className="steps__text">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Capitulo>
  );
}

/* ---------- Spread 3, direita: Página final ---------- */
export function PaginaFinal({ onRestart }) {
  return (
    <div className="ending">
      <span className="ending__ornament" aria-hidden="true">◆</span>
      <h3 className="page__title">Fim… por enquanto</h3>
      <p className="ending__text">
        Os próximos capítulos serão escritos pelas próximas turmas. Enquanto
        isso, que tal conhecer o que já foi feito?
      </p>

      <div className="ending__actions">
        <Button href="#projetos" variant="primary">Explorar projetos</Button>
        {/* Sem href, o nosso Button vira um <button> de verdade */}
        <Button variant="ghost" onClick={onRestart}>Reler o livro</Button>
      </div>
    </div>
  );
}