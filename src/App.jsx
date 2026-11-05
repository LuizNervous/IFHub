import { Routes, Route } from "react-router-dom";
import Layout from "./componets/Layout/Layout";
import HomePage from "./pages/HomePage";
import SobrePage from "./pages/SobrePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="sobre" element={<SobrePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;