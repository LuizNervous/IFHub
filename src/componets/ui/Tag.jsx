import "./Tag.css";

function Tag({ color, children }) {
  // Passamos a cor para o CSS como uma variável, usando o atributo style.
  const style = color ? { "--tag-color": color } : undefined;

  return (
    <span className="tag" style={style}>
      {children}
    </span>
  );
}

export default Tag;