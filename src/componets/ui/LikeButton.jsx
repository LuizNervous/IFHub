import "./LikeButton.css";

// Componente APRESENTACIONAL: só desenha o que recebe.
//   count    -> número de curtidas
//   liked    -> true se o usuário atual já curtiu
//   onToggle -> função chamada ao clicar. Se não vier, o botão é só visual.
//   subject  -> nome do projeto (para leitores de tela)
function LikeButton({ count = 0, liked = false, onToggle, subject }) {
  const interactive = typeof onToggle === "function";

  return (
    <button
      type="button"
      className={`like ${liked ? "is-liked" : ""}`}
      aria-pressed={liked}
      aria-disabled={!interactive}
      title={interactive ? undefined : "Curtidas em breve"}
      onClick={interactive ? onToggle : undefined}
    >
      <svg className="like__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <span className="like__count">{count.toLocaleString("pt-BR")}</span>
      <span className="visually-hidden">
        {" "}curtidas{subject ? ` em ${subject}` : ""}
      </span>
    </button>
  );
}

export default LikeButton;