import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import Layout from "./components/layout/Layout";
import RotaProtegida from "./components/layout/RotaProtegida";
import DashboardPage from "./pages/DashboardPage";
import EquipamentoPage from "./pages/EquipamentoPage";
import LoginPage from "./pages/LoginPage";
import SetorPage from "./pages/SetorPage";
import UsuariosPage from "./pages/UsuariosPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />

          {/* Tudo abaixo exige login */}
          <Route element={<RotaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="equipamentos/:id" element={<EquipamentoPage />} />
              <Route element={<RotaProtegida somenteAdmin />}>
                <Route path="usuarios" element={<UsuariosPage />} />
              </Route>
              <Route path=":setor/:aba" element={<SetorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
