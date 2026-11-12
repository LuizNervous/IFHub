import { useState } from "react";
import SafeImage from "../ui/SafeImage";
import Tag from "../ui/Tag";
import FormField from "../ui/FormField";
import { getTurmaColor } from "../ui/FilterBar";
import { getTechColor } from "../../data/technologies";
import { isSafeUrl } from "../../utils/isSafeUrl";

const formatarData = (iso) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

// Um link enviado por um visitante. Mostramos o endereço COMPLETO (o admin precisa ver para onde vai),
// só como link se o protocolo for http/https, e sempre em nova aba sem dar acesso à nossa janela.
function LinkSeguro({ url }) {
  if (!url) return <span className="mod-muted">—</span>;
  if (!isSafeUrl(url)) return <span className="mod-aviso">Endereço inválido (não abra)</span>;
  return (
    <a href={url} className="mod-link" target="_blank" rel="noopener noreferrer" title={url}>
      <span className="mod-link__texto">{url}</span>
      <span aria-hidden="true"> ↗</span>
      <span className="visually-hidden"> (abre em nova aba)</span>
    </a>
  );
}

// Um projeto para revisar. Todo texto vem de visitantes: o React escapa tudo (nunca usamos
// dangerouslySetInnerHTML), então um "<script>" digitado por alguém aparece como texto simples.
function ModeracaoCard({ projeto, onModerar }) {
  const [modo, setModo] = useState("inicio"); // "inicio" | "aprovar" | "rejeitar"
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const turma = projeto.turmas?.nome ?? "—";
  const cor = getTurmaColor(turma);
  const sub = Array.isArray(projeto.projeto_submissoes) ? projeto.projeto_submissoes[0] : projeto.projeto_submissoes;
  const tecnologias = (projeto.projeto_tecnologias ?? []).map((pt) => pt.tecnologias?.nome).filter(Boolean);
  const pendente = projeto.status === "pendente";

  async function executar(acao) {
    if (ocupado) return;
    if (acao === "rejeitar" && motivo.trim().length < 3) {
      setErro("Escreva o motivo da rejeição (mínimo 3 caracteres).");
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      await onModerar(projeto.id, acao, acao === "rejeitar" ? motivo.trim() : null);
      // sucesso: o card sai da lista e este componente é desmontado
    } catch (e) {
      setErro(e.message);
      setOcupado(false);
    }
  }

  return (
    <article className="mod-card" style={{ "--turma-color": cor }}>
      <div className="mod-card__media">
        <SafeImage
          src={projeto.imagem_url}
          alt={`Print da tela inicial de ${projeto.titulo}`}
          loading="lazy"
          fallback={<span className="mod-card__sem-imagem">Sem imagem</span>}
        />
        <span className="mod-card__turma">
          <span className="mod-card__turma-ponto" aria-hidden="true" />
          {turma}
        </span>
      </div>

      <div className="mod-card__body">
        <p className="mod-card__data">
          Enviado em <time dateTime={projeto.criado_em}>{formatarData(projeto.criado_em)}</time>
        </p>
        <h2 className="mod-card__title">{projeto.titulo}</h2>
        <p className="mod-card__desc">{projeto.descricao}</p>

        <dl className="mod-meta">
          <div className="mod-meta__linha">
            <dt>Site</dt>
            <dd><LinkSeguro url={projeto.site_url} /></dd>
          </div>
          <div className="mod-meta__linha">
            <dt>Repositório</dt>
            <dd><LinkSeguro url={projeto.repo_url} /></dd>
          </div>
          <div className="mod-meta__linha">
            <dt>Contato</dt>
            <dd>{sub?.email_contato ?? "—"}</dd>
          </div>
          <div className="mod-meta__linha">
            <dt>Equipe</dt>
            <dd>
              {(projeto.integrantes ?? []).length === 0
                ? "—"
                : projeto.integrantes.map((i) => (i.funcao ? `${i.nome} (${i.funcao})` : i.nome)).join(" · ")}
            </dd>
          </div>
        </dl>

        {tecnologias.length > 0 && (
          <ul className="mod-tags" aria-label="Tecnologias">
            {tecnologias.map((t) => (
              <li key={t}><Tag color={getTechColor(t)}>{t}</Tag></li>
            ))}
          </ul>
        )}

        {(projeto.destaques ?? []).length > 0 && (
          <ul className="mod-destaques">
            {projeto.destaques.map((d, i) => (
              <li key={i}>{d.texto}</li>
            ))}
          </ul>
        )}

        {!pendente && (
          <p className="mod-revisao">
            {projeto.status === "aprovado" ? "Aprovado" : "Rejeitado"} em {formatarData(projeto.revisado_em)}
            {projeto.status === "rejeitado" && sub?.motivo_rejeicao && (
              <>
                <br />
                <span className="mod-revisao__motivo">Motivo: {sub.motivo_rejeicao}</span>
              </>
            )}
          </p>
        )}

        {pendente && (
          <div className="mod-acoes">
            {modo === "inicio" && (
              <>
                <button type="button" className="mod-btn mod-btn--aprovar" onClick={() => setModo("aprovar")}>
                  Aprovar
                </button>
                <button type="button" className="mod-btn mod-btn--rejeitar" onClick={() => setModo("rejeitar")}>
                  Rejeitar
                </button>
              </>
            )}

            {modo === "aprovar" && (
              <div className="mod-confirma" role="group" aria-label="Confirmar aprovação">
                <p className="mod-confirma__texto">Publicar este projeto no site agora?</p>
                <div className="mod-confirma__botoes">
                  <button type="button" className="mod-btn mod-btn--aprovar" disabled={ocupado} onClick={() => executar("aprovar")}>
                    {ocupado ? "Publicando…" : "Sim, publicar"}
                  </button>
                  <button type="button" className="mod-btn mod-btn--neutro" disabled={ocupado} onClick={() => { setModo("inicio"); setErro(""); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {modo === "rejeitar" && (
              <div className="mod-confirma" role="group" aria-label="Confirmar rejeição">
                <FormField
                  id={`motivo-${projeto.id}`}
                  as="textarea"
                  label="Motivo da rejeição"
                  required
                  counter
                  maxLength={500}
                  rows={3}
                  value={motivo}
                  hint="Fica registrado só para os administradores. Não aparece no site."
                  onChange={(e) => { setMotivo(e.target.value); setErro(""); }}
                />
                <div className="mod-confirma__botoes">
                  <button type="button" className="mod-btn mod-btn--rejeitar" disabled={ocupado} onClick={() => executar("rejeitar")}>
                    {ocupado ? "Rejeitando…" : "Confirmar rejeição"}
                  </button>
                  <button type="button" className="mod-btn mod-btn--neutro" disabled={ocupado} onClick={() => { setModo("inicio"); setErro(""); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {erro && <p className="admin-alert admin-alert--erro" role="alert">{erro}</p>}
          </div>
        )}
      </div>
    </article>
  );
}

export default ModeracaoCard;