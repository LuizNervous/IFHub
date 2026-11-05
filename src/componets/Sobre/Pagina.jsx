// Uma página do livro. Não sabe nada sobre o conteúdo: só o "papel".
// Props:
//   side     -> "left" ou "right" (muda o sombreado perto da lombada)
//   number   -> número impresso no rodapé (opcional)
//   inactive -> true quando a página não está visível
function Pagina({ side, number, inactive = false, children }) {
  return (
    <div
      className={`page page--${side}`}
      // "Ref callback": o React chama esta função com o elemento real.
      // `inert` faz o navegador ignorar a página: sem foco no Tab e sem leitura
      // por leitores de tela. Assim ninguém "tabula" em um botão que está escondido.
      ref={(element) => {
        if (element) element.inert = inactive;
      }}
    >
      {children}
      {number && <span className="page__number">— {number} —</span>}
    </div>
  );
}

export default Pagina;