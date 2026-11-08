import { getTechColor } from "../../data/technologies";
import { LIMITES } from "../../utils/validateProjeto";

// Escolha de tecnologias em "chips". Cada chip é um botão que liga/desliga a tecnologia.
//   opcoes      -> todas as tecnologias disponíveis (vêm do banco)
//   selecionadas-> as que o usuário já escolheu
//   onToggle    -> chamada com o nome da tecnologia clicada
function TecnologiasPicker({ opcoes, selecionadas, onToggle, erro, carregando }) {
  const max = LIMITES.tecnologias.max;
  const cheio = selecionadas.length >= max;

  return (
    <fieldset
      className="tech-picker"
      tabIndex={-1}
      data-invalid={erro ? "true" : undefined}
      aria-describedby={erro ? "tecnologias-erro" : undefined}
    >
      <legend className="visually-hidden">Tecnologias utilizadas</legend>

      <div className="tech-picker__head">
        <span className="tech-picker__rule">Escolha de 1 a {max}</span>
        <span className="tech-picker__count" aria-live="polite">
          {selecionadas.length}/{max}
        </span>
      </div>

      {carregando ? (
        <p className="tech-picker__loading">Carregando tecnologias…</p>
      ) : (
        <div className="tech-picker__list">
          {opcoes.map((nome) => {
            const ativo = selecionadas.includes(nome);
            return (
              <button
                key={nome}
                type="button"
                className={`tech-chip ${ativo ? "is-active" : ""}`}
                style={{ "--chip-color": getTechColor(nome) }}
                aria-pressed={ativo}
                disabled={cheio && !ativo}
                onClick={() => onToggle(nome)}
              >
                {nome}
              </button>
            );
          })}
        </div>
      )}

      {cheio && <p className="field__hint">Limite de {max} tecnologias atingido.</p>}
      {erro && (
        <p id="tecnologias-erro" className="field__error" style={{ "--field-error": "#f87171" }}>
          <span aria-hidden="true">⚠ </span>
          {erro}
        </p>
      )}
    </fieldset>
  );
}

export default TecnologiasPicker;
