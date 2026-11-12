import AuthGuard from "../../componets/Admin/AuthGuard";
import Painel from "../../componets/Admin/Painel";
import { useAuth } from "../../hooks/useAuth";
import { useNoIndex } from "../../hooks/useNoIndex";
import "../../componets/Admin/Admin.css";

// A página só MONTA as peças. O AuthGuard só deixa o <Painel> aparecer para um admin com MFA.
function AdminPage() {
  useNoIndex();
  const auth = useAuth();

  return (
    <AuthGuard estado={auth.estado} usuario={auth.usuario} onReverificar={auth.reverificar} onSair={auth.sair}>
      <Painel usuario={auth.usuario} onSair={auth.sair} />
    </AuthGuard>
  );
}

export default AdminPage;