import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { buscarPainel, type Painel } from "../../api/painel";
import { useCarregar } from "../../hooks/useCarregar";
import Sidebar from "./Sidebar";
import Header from "./Header";

/** Dados do painel que o Layout busca e repassa às páginas (o sino do cabeçalho e o Painel usam o mesmo). */
export type PainelContexto = { painel: Painel | null; erro: string | null };

/**
 * Layout principal: Sidebar + Header + área de conteúdo.
 * As páginas filhas são renderizadas em <Outlet />.
 */
export default function Layout() {
  // Aberta por padrão no desktop, fechada no mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const { pathname } = useLocation();

  // Atualiza a cada troca de página; os números antigos ficam na tela até os novos chegarem
  const { dados: painel, erro } = useCarregar("painel", (signal) => buscarPainel(signal), pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans text-slate-800">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} painel={painel} />

        <main className="flex-1 overflow-y-auto px-6 pb-6">
          <Outlet context={{ painel, erro } satisfies PainelContexto} />
        </main>
      </div>
    </div>
  );
}
