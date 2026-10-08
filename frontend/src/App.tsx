import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          {/* demais rotas: /equipamentos, /clientes, /relatorios/... */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
