import Logo from "../ui/Logo";

// A moldura das telas de autenticação (login, MFA, redefinição, acesso negado).
// Só desenha: logo, título e o cartão. O conteúdo entra como `children`.
function AuthShell({ title, subtitle, children }) {
  return (
    <main className="admin-auth">
      <div className="admin-auth__glow" aria-hidden="true" />
      <div className="admin-auth__card">
        <div className="admin-auth__brand">
          <Logo />
          <span className="admin-badge">Admin</span>
        </div>
        <h1 className="admin-auth__title">{title}</h1>
        {subtitle && <p className="admin-auth__subtitle">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}

export default AuthShell;