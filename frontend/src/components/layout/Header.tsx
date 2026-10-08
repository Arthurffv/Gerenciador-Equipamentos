import { Bell, CircleHelp, Menu, Search } from "lucide-react";

type HeaderProps = {
  onToggleSidebar: () => void;
  userName?: string;
  notifications?: number;
};

export default function Header({
  onToggleSidebar,
  userName = "Renato Luiz de Mello",
  notifications = 0,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-4 px-6 py-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded p-1 text-brand hover:bg-slate-100"
        aria-label="Alternar menu lateral"
      >
        <Menu size={24} />
      </button>

      {/* Barra de pesquisa */}
      <label className="relative w-full max-w-sm">
        <span className="sr-only">Pesquisar</span>
        <Search
          size={18}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          placeholder="Pesquisar..."
          className="w-full rounded-full bg-slate-200/70 py-2.5 pl-11 pr-4 text-sm font-medium
            text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </label>

      <div className="ml-auto flex items-center gap-5">
        <button type="button" className="text-slate-600 hover:text-brand" aria-label="Ajuda">
          <CircleHelp size={22} />
        </button>

        <button
          type="button"
          className="relative text-slate-600 hover:text-brand"
          aria-label={`Notificações${notifications ? ` (${notifications})` : ""}`}
        >
          <Bell size={22} />
          {notifications > 0 && (
            <span className="absolute -right-3 -top-2 rounded-full bg-status-off px-1.5 text-[10px] font-bold leading-4 text-white">
              {notifications > 99 ? "99+" : notifications}
            </span>
          )}
        </button>

        {/* Menu de usuário */}
        <button type="button" className="flex items-center gap-3" aria-label="Menu do usuário">
          <span className="hidden text-sm font-semibold text-slate-600 sm:block">{userName}</span>
          <span className="h-10 w-10 rounded-full border-2 border-slate-500 bg-white" />
        </button>
      </div>
    </header>
  );
}
