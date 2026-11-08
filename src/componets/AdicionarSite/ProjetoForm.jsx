import FormField from "../ui/FormField";
import Button from "../ui/Button";
import FormSection from "./FormSection";
import TecnologiasPicker from "./TecnologiasPicker";
import MembrosFieldset from "./MembrosFieldset";
import DestaquesFieldset from "./DestaquesFieldset";
import { LIMITES } from "../../utils/validateProjeto";

// O formulário em si. Ele NÃO guarda estado: recebe tudo pronto do hook (prop `form`)
// e das listas de opções (prop `opcoes`). Só desenha e liga os eventos.
function ProjetoForm({ form, opcoes }) {
  const {
    valores, erros, status, erroGeral,
    setCampo, validarAoSair, toggleTecnologia,
    adicionarIntegrante, removerIntegrante, alterarIntegrante,
    adicionarDestaque, removerDestaque, alterarDestaque,
    enviar,
  } = form;

  const enviando = status === "enviando";
  const carregando = opcoes.status === "loading";
  const semOpcoes = opcoes.status !== "ready";

  // Atalho: as 4 props que TODO campo simples precisa (valor, erro, ao digitar, ao sair).
  // Assim cada campo abaixo fica curto: {...campo("titulo")}
  const campo = (nome) => ({
    value: valores[nome],
    error: erros[nome],
    onChange: (evento) => setCampo(nome, evento.target.value),
    onBlur: () => validarAoSair(nome),
  });

  return (
    // noValidate: desliga os balões feios do navegador; usamos as nossas mensagens.
    <form className="project-form" onSubmit={enviar} noValidate>
      {opcoes.status === "error" && (
        <p className="form-alert" role="alert">
          Não foi possível carregar as listas de turmas e tecnologias. Recarregue a página para tentar de novo.
        </p>
      )}

      <FormSection number={1} title="Sobre o projeto" description="O básico: como ele se chama e o que faz.">
        <div className="form-grid">
          <div className="form-grid__full">
            <FormField
              id="campo-titulo"
              label="Título do projeto"
              required
              counter
              maxLength={LIMITES.titulo.max}
              placeholder="Ex.: Sistema de Gestão de Biblioteca"
              autoComplete="off"
              {...campo("titulo")}
            />
          </div>

          <FormField
            id="campo-turma"
            as="select"
            label="Turma"
            required
            disabled={semOpcoes}
            {...campo("turma")}
          >
            <option value="">{carregando ? "Carregando…" : "Selecione a turma"}</option>
            {opcoes.turmas.map((turma) => (
              <option key={turma} value={turma}>
                {turma}
              </option>
            ))}
          </FormField>

          <FormField
            id="campo-orientador"
            label="Professor orientador"
            optional
            maxLength={LIMITES.orientador.max}
            placeholder="Ex.: Prof. Carlos Almeida"
            autoComplete="off"
            {...campo("orientador")}
          />

          <div className="form-grid__full">
            <FormField
              id="campo-descricao"
              as="textarea"
              label="Descrição"
              required
              counter
              maxLength={LIMITES.descricao.max}
              placeholder="Conte o que o projeto faz, que problema resolve e para quem."
              hint={`Mínimo de ${LIMITES.descricao.min} caracteres.`}
              {...campo("descricao")}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        number={2}
        title="Onde ele está"
        description="Informe o link do site no ar, o do código, ou os dois."
      >
        <div className="form-grid">
          <FormField
            id="campo-site_url"
            type="url"
            inputMode="url"
            label="Link do site"
            placeholder="https://meu-projeto.vercel.app"
            autoComplete="off"
            hint="Precisa começar com http:// ou https://"
            {...campo("site_url")}
          />
          <FormField
            id="campo-repo_url"
            type="url"
            inputMode="url"
            label="Link do repositório"
            placeholder="https://github.com/usuario/projeto"
            autoComplete="off"
            hint="GitHub, GitLab ou similar"
            {...campo("repo_url")}
          />
        </div>
      </FormSection>

      <FormSection number={3} title="Tecnologias" description="O que foi usado para construir o projeto.">
        <TecnologiasPicker
          opcoes={opcoes.tecnologias}
          selecionadas={valores.tecnologias}
          onToggle={toggleTecnologia}
          erro={erros.tecnologias}
          carregando={carregando}
        />
      </FormSection>

      <FormSection number={4} title="A equipe" description="Quem participou do projeto.">
        <MembrosFieldset
          membros={valores.integrantes}
          erros={erros}
          onAdd={adicionarIntegrante}
          onRemove={removerIntegrante}
          onChange={alterarIntegrante}
          onBlur={validarAoSair}
        />
      </FormSection>

      <FormSection
        number={5}
        title="Destaques"
        description="Conquistas e diferenciais. Esta etapa é opcional, mas deixa o projeto mais interessante."
      >
        <DestaquesFieldset
          destaques={valores.destaques}
          erros={erros}
          onAdd={adicionarDestaque}
          onRemove={removerDestaque}
          onChange={alterarDestaque}
          onBlur={validarAoSair}
        />
      </FormSection>

      <FormSection
        number={6}
        title="Seu contato"
        description="Usamos este e-mail apenas para falar com você sobre o envio. Ele nunca aparece no site."
      >
        <FormField
          id="campo-email_contato"
          type="email"
          label="E-mail de contato"
          required
          maxLength={LIMITES.email.max}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          {...campo("email_contato")}
        />
      </FormSection>

      {/* Campo-isca (honeypot): escondido para humanos. Robôs costumam preencher tudo. */}
      <div className="form-trap" aria-hidden="true">
        <label>
          Não preencha este campo
          <input
            type="text"
            name="confirmacao_interna"
            tabIndex={-1}
            autoComplete="off"
            value={valores.hp}
            onChange={(evento) => setCampo("hp", evento.target.value)}
          />
        </label>
      </div>

      {erroGeral && (
        <p className="form-alert" role="alert">
          {erroGeral}
        </p>
      )}

      <div className="project-form__submit">
        <Button type="submit" variant="primary" disabled={enviando || semOpcoes} aria-busy={enviando}>
          {enviando ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            "Enviar para análise"
          )}
        </Button>
        <p className="project-form__note">
          Seu projeto <strong>não é publicado na hora</strong>: um administrador revisa cada envio antes
          de ele aparecer no site.
        </p>
      </div>
    </form>
  );
}

export default ProjetoForm;