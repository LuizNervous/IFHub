// Uma "etapa" visual do formulário: número + título + descrição + o conteúdo (children).
// Não sabe nada sobre os campos: só desenha a moldura.
function FormSection({ number, title, description, children }) {
  return (
    <section className="form-section" aria-labelledby={`secao-${number}`}>
      <header className="form-section__header">
        <span className="form-section__number" aria-hidden="true">
          {number}
        </span>
        <div>
          <h2 id={`secao-${number}`} className="form-section__title">
            {title}
          </h2>
          {description && <p className="form-section__description">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export default FormSection;
