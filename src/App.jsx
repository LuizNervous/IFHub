import { Routes, Route } from "react-router-dom";
import Layout from "./componets/Layout/Layout";
import HomePage from "./pages/HomePage";
import SobrePage from "./pages/SobrePage";
import NotFoundPage from "./pages/NotFoundPage";
import AdicionarSitePage from "./pages/AdicionarSitePage";
import AdminPage from "./pages/Admin/AdminPage";
import AdminLoginPage from "./pages/Admin/AdminLoginPage";
import AdminResetSenhaPage from "./pages/Admin/AdminResetSenhaPage";

function App() {
  return (
    <Routes>
      {/* Páginas públicas: dentro do Layout (com o header e o rodapé do site) */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="sobre" element={<SobrePage />} />
        <Route path="adicionar-site" element={<AdicionarSitePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Área administrativa: FORA do Layout (tela própria, sem o menu público) */}
      <Route path="admin" element={<AdminPage />} />
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin/redefinir-senha" element={<AdminResetSenhaPage />} />
    </Routes>
  );
}

export default App;