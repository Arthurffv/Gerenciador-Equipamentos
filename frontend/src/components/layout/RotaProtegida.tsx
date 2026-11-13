import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/contexto";

/** Só deixa passar quem está logado (e, com `somenteAdmin`, quem é administrador). */
export default function RotaProtegida({ somenteAdmin = false }: { somenteAdmin?: boolean }) {
  const { usuario, carregando, ehAdmin } = useAuth();
  const local = useLocation();

  if (carregando) return <p className="grid min-h-screen place-items-center text-slate-500">Carregando...</p>;
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname + local.search }} />;
  if (somenteAdmin && !ehAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
