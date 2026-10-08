import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import SetorPage from "./pages/SetorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/campo/geral" replace />} />
          <Route path=":setor/:aba" element={<SetorPage />} />
          <Route path="*" element={<Navigate to="/campo/geral" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
