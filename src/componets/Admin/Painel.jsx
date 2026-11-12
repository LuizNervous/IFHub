import { useState } from "react";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import ModeracaoCard from "./ModeracaoCard";
import { usePainel } from "../../hooks/usePainel";

// As três "gavetas" do painel. Cada uma é também um botão-aba com o contador.
const ABAS = [
  { id: "pendente", rotulo: "Pendentes", cor: "var(--color-sky)" },
  { id: "aprovado", rotulo: "Aprovados", cor: "var(--color-green)" },
  { id: "rejeitado", rotulo: "Rejeitados", cor: "#f87171" },
];

const VAZIO = {
  pendente: "Nenhum projeto aguardando revisão. Está tudo em dia.",
  aprovado: "Nenhum projeto aprovado ainda.",
  rejeitado: "Nenhum projeto rejeitado.",
};

// Só é montado quando o AuthGuard confirma "admin": os dados nem são pedidos antes disso.
function Painel({ usuario, onSair }) {
  const [aba, setAba] = useState("pendente");
  const { projetos, carga, contagens, carregar, moderar } = usePainel(aba);

  return (
    <div className="admin-panel">
      <header className="admin-bar">
        <div className="admin-bar__inner">
          <div className="admin-bar__brand">
            <Logo />
            <span className="admin-badge">Painel</span>
          </div>
          <div className="admin-bar__user">
            <span className="admin-bar__email" title={usuario?.email}>{usuario?.email}</span>
            <Button variant="ghost" size="sm" onClick={onSair}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-main__inner">
          <div className="admin-head">
            <p className="admin-head__eyebrow">Moderação</p>
            <h1 className="admin-head__title">Projetos enviados</h1>
            <p className="admin-head__text">
              Nada é publicado sem a sua aprovação. Confira o print, a descrição e os links antes de aprovar.
            </p>
          </div>

          <div className="admin-tabs" role="tablist" aria-label="Status dos projetos">
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                id={`aba-${a.id}`}
                aria-selected={aba === a.id}
                aria-controls="painel-lista"
                className={`admin-tab ${aba === a.id ? "is-active" : ""}`}
                style={{ "--aba-cor": a.cor }}
                onClick={() => setAba(a.id)}
              >
                <span className="admin-tab__numero">{contagens[a.id]}</span>
                <span className="admin-tab__rotulo">{a.rotulo}</span>
              </button>
            ))}
          </div>

          <section id="painel-lista" role="tabpanel" aria-labelledby={`aba-${aba}`} className="admin-lista">
            {aba === "pendente" && projetos.length > 0 && (
              <p className="admin-dica">
                Dica: os links abrem em nova aba. Desconfie de endereços estranhos e não informe dados pessoais em sites de terceiros.
              </p>
            )}

            {carga === "carregando" && <p className="admin-estado" role="status">Carregando…</p>}

            {carga === "erro" && (
              <div className="admin-estado" role="alert">
                <p>Não foi possível carregar os projetos.</p>
                <Button variant="ghost" size="sm" onClick={carregar}>Tentar de novo</Button>
              </div>
            )}

            {carga === "ok" && projetos.length === 0 && <p className="admin-estado">{VAZIO[aba]}</p>}

            {carga === "ok" &&
              projetos.map((p) => <ModeracaoCard key={p.id} projeto={p} onModerar={moderar} />)}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Painel;