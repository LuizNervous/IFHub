import FormField from "../ui/FormField";
import Button from "../ui/Button";
import { LIMITES } from "../../utils/validateProjeto";

// Lista dinâmica de integrantes. É um componente "burro": recebe os dados e as
// funções por props e não guarda estado nenhum (quem guarda é o hook useProjetoForm).
function MembrosFieldset({ membros, erros, onAdd, onRemove, onChange, onBlur }) {
  const { max, min } = LIMITES.integrantes;

  return (
    <fieldset className="members">
      <legend className="visually-hidden">Integrantes do projeto</legend>

      <ul className="members__list">
        {membros.map((membro, i) => (
          <li key={membro.id} className="members__row">
            <FormField
              id={`campo-integrantes-${i}-nome`}
              label={`Integrante ${i + 1}`}
              required
              maxLength={LIMITES.integranteNome.max}
              placeholder="Nome completo"
              autoComplete="off"
              value={membro.nome}
              error={erros[`integrantes.${i}.nome`]}
              onChange={(e) => onChange(membro.id, "nome", e.target.value)}
              onBlur={() => onBlur(`integrantes.${i}.nome`)}
            />
            <FormField
              id={`campo-integrantes-${i}-funcao`}
              label="Função"
              optional
              maxLength={LIMITES.integranteFuncao.max}
              placeholder="Ex.: Front-end e design"
              autoComplete="off"
              value={membro.funcao}
              error={erros[`integrantes.${i}.funcao`]}
              onChange={(e) => onChange(membro.id, "funcao", e.target.value)}
              onBlur={() => onBlur(`integrantes.${i}.funcao`)}
            />
            <button
              type="button"
              className="list-remove"
              aria-label={`Remover integrante ${i + 1}`}
              disabled={membros.length <= min}
              onClick={() => onRemove(membro.id)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>

      {erros.integrantes && <p className="form-alert form-alert--inline">{erros.integrantes}</p>}

      <div className="list-footer">
        <Button variant="ghost" size="sm" disabled={membros.length >= max} onClick={onAdd}>
          + Adicionar integrante
        </Button>
        <span className="list-footer__count" aria-live="polite">
          {membros.length}/{max}
        </span>
      </div>
    </fieldset>
  );
}

export default MembrosFieldset;