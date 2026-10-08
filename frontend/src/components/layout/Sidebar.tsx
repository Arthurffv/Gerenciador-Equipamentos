import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { abas, setores, type Setor } from "../../config/setores";

const linkBase =
  "flex items-center gap-3 rounded-full px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10";

function SetorMenu({ setor, onNavigate }: { setor: Setor; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const Icon = setor.icon;

  // Já nasce aberto se a página atual pertence a este setor
  const [expanded, setExpanded] = useState(pathname.startsWith(`/${setor.slug}/`));

  return (
    <li>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className={`${linkBase} w-full`}
      >
        <Icon size={18} aria-hidden />
        <span className="flex-1 text-left">{setor.label}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <ul className="ml-9 mt-1 space-y-1 border-l border-white/20 pl-3">
          {abas.map((aba) => (
            <li key={aba.slug}>
              <NavLink
                to={`/${setor.slug}/${aba.slug}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 ${
                    isActive ? "bg-brand-active font-medium text-white" : ""
                  }`
                }
              >
                {aba.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  // Em telas pequenas, fecha o menu ao navegar
  const handleNavigate = () => {
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-64 flex-col
          rounded-br-[2rem] bg-brand shadow-xl lg:static lg:z-auto lg:shadow-none`}
        aria-label="Menu principal"
      >
        {/* Logo */}
        <div className="relative flex h-44 shrink-0 items-center justify-center rounded-br-[2rem] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded p-1 text-brand lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
          {/* Troque pelo logotipo real em /public/logo.svg */}
          <img src="/logo.svg" alt="Logotipo da empresa" className="max-h-24 max-w-[70%]" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-6">
          <ul className="space-y-1">
            {setores.map((setor) => (
              <SetorMenu key={setor.slug} setor={setor} onNavigate={handleNavigate} />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
