import { useProjetoForm } from "../hooks/useProjetoForm";
import { useOpcoesProjeto } from "../hooks/useOpcoesProjeto";
import ProjetoForm from "../componets/AdicionarSite/ProjetoForm";
import ProjetoPreview from "../componets/AdicionarSite/ProjetoPreview";
import EnvioConcluido from "../componets/AdicionarSite/EnvioConcluido";
import "../componets/AdicionarSite/AdicionarSite.css";

const ETAPAS = [
  { titulo: "Você envia", texto: "Preencha o formulário com os dados do projeto." },
  { titulo: "Nós revisamos", texto: "Um administrador confere cada envio." },
  { titulo: "Ele é publicado", texto: "Aprovado, o projeto entra na estante do IFHub." },
];

// A página só MONTA as peças. A lógica mora nos hooks; o visual, nos componentes.
function AdicionarSitePage() {
  const form = useProjetoForm();
  const opcoes = useOpcoesProjeto();

  if (form.status === "enviado") {
    return <EnvioConcluido titulo={form.valores.titulo} onNovoEnvio={form.reiniciar} />;
  }

  return (
    <section className="add-site" aria-labelledby="add-site-title">
      <div className="add-site__container">
        <header className="add-site__header">
          <p className="add-site__eyebrow">Adicione seu site</p>
          <h1 id="add-site-title" className="add-site__title">
            Mostre o seu projeto para <span>todo o campus</span>
          </h1>
          <p className="add-site__lead">
            Cadastre seu Projeto Final de Curso (ou qualquer outro projeto) no IFHub. Leva poucos minutos.
          </p>

          <ol className="add-site__steps">
            {ETAPAS.map((etapa, i) => (
              <li key={etapa.titulo} className="add-site__step">
                <span className="add-site__step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <strong>{etapa.titulo}</strong>
                  <span>{etapa.texto}</span>
                </div>
              </li>
            ))}
          </ol>
        </header>

        <div className="add-site__layout">
          <ProjetoForm form={form} opcoes={opcoes} />
          <ProjetoPreview valores={form.valores} />
        </div>
      </div>
    </section>
  );
}

export default AdicionarSitePage;