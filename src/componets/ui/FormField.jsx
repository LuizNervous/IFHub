import "./FormField.css";

// Um campo de formulário COMPLETO e reutilizável: rótulo + controle + dica + contador + erro.
//
// Props principais:
//   id        -> liga o <label> ao campo (htmlFor) e ao texto de erro/dica (aria-describedby)
//   label     -> texto do rótulo
//   as        -> "input" (padrão), "textarea" ou "select"
//   error     -> mensagem de erro (se existir, o campo fica vermelho e "aria-invalid")
//   hint      -> dica abaixo do campo (some quando há erro)
//   required  -> mostra o asterisco; optional -> mostra "opcional"
//   counter   -> mostra "12/120" (precisa de maxLength)
// Todo o resto (value, onChange, onBlur, placeholder, type...) vai direto para o campo (...rest).
function FormField({
  id,
  label,
  as: Control = "input",
  error,
  hint,
  required = false,
  optional = false,
  counter = false,
  maxLength,
  value = "",
  children,
  ...rest
}) {
  const hintId = hint ? `${id}-dica` : undefined;
  const errorId = error ? `${id}-erro` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {" "}*
          </span>
        )}
        {optional && <span className="field__optional">opcional</span>}
      </label>

      <Control
        id={id}
        className="field__control"
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        {...rest}
      >
        {children}
      </Control>

      <div className="field__foot">
        {error ? (
          <p id={errorId} className="field__error">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="field__hint">
              {hint}
            </p>
          )
        )}
        {counter && maxLength && (
          <span className="field__counter" aria-hidden="true">
            {String(value).length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export default FormField;