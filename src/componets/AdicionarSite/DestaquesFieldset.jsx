import FormField from "../ui/FormField";
import Button from "../ui/Button";
import { LIMITES } from "../../utils/validateProjeto";

// Destaques são opcionais: a lista começa VAZIA e o usuário adiciona quantas linhas quiser (até o limite).
function DestaquesFieldset({ destaques, erros, onAdd, onRemove, onChange, onBlur }) {
  const max = LIMITES.destaques.max;

  return (
    <fieldset className="members">
      <legend className="visually-hidden">Destaques do projeto</legend>

      {destaques.length === 0 && (
        <p className="members__empty">
          Nenhum destaque ainda. Que tal citar um prêmio, um número de usuários ou uma tecnologia diferente?
        </p>
      )}

      <ul className="members__list">
        {destaques.map((destaque, i) => (
          <li key={destaque.id} className="members__row members__row--single">
            <FormField
              id={`campo-destaques-${i}`}
              label={`Destaque ${i + 1}`}
              counter
              maxLength={LIMITES.destaque.max}
              placeholder="Ex.: Apresentado na Mostra de Projetos do campus"
              autoComplete="off"
              value={destaque.texto}
              error={erros[`destaques.${i}`]}
              onChange={(e) => onChange(destaque.id, e.target.value)}
              onBlur={() => onBlur(`destaques.${i}`)}
            />
            <button
              type="button"
              className="list-remove"
              aria-label={`Remover destaque ${i + 1}`}
              onClick={() => onRemove(destaque.id)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="list-footer">
        <Button variant="ghost" size="sm" disabled={destaques.length >= max} onClick={onAdd}>
          + Adicionar destaque
        </Button>
        <span className="list-footer__count" aria-live="polite">
          {destaques.length}/{max}
        </span>
      </div>
    </fieldset>
  );
}

export default DestaquesFieldset;
