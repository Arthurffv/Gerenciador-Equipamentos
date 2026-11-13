import { Menu } from "lucide-react";
import type { Painel } from "../../api/painel";
import BuscaGlobal from "./BuscaGlobal";
import MenuUsuario from "./MenuUsuario";
import Notificacoes from "./Notificacoes";

type HeaderProps = {
  onToggleSidebar: () => void;
  painel: Painel | null;
};

export default function Header({ onToggleSidebar, painel }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <button type="button" onClick={onToggleSidebar} className="rounded p-1 text-brand hover:bg-slate-100" aria-label="Alternar menu lateral">
        <Menu size={24} />
      </button>

      <BuscaGlobal />

      <div className="ml-auto flex items-center gap-5">
        <Notificacoes painel={painel} />
        <MenuUsuario />
      </div>
    </header>
  );
}
