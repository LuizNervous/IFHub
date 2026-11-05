import Button from "../componets/ui/Button";

function NotFoundPage() {
  return (
    <section
      style={{
        display: "grid",
        placeItems: "center",
        gap: 16,
        minHeight: "60vh",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "3rem" }}>Página não encontrada</h1>
        <p style={{ color: "var(--color-muted)" }}>
          O endereço que você abriu não existe no IFHub.
        </p>
        <Button to="/" variant="primary">Voltar ao início</Button>
      </div>
    </section>
  );
}

export default NotFoundPage;