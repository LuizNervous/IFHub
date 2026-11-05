import "./Button.css";

function Button({ href, variant = "primary", size = "md", children, ...rest }) {
  const className = `button button--${variant} button--${size}`;

  if (href) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={className} {...rest}>
      {children}
    </button>
  );
}

export default Button;