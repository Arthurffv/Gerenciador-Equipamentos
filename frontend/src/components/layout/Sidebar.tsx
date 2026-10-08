import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Gauge,
  ListChecks,
  Network,
  Users,
  User,
  HardDrive,
  Building2,
  FileText,
  BarChart3,
  FileBarChart,
  History,
  FileDown,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Itens com submenu (ex.: Clientes > Listar / Novo) */
  children?: { label: string; to: string }[];
};

type NavSection = { title: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    title: "Sistema",
    items: [
      { label: "Dashboard", to: "/", icon: Gauge },
      { label: "Lista de Monitorados", to: "/monitorados", icon: ListChecks },
      { label: "Supervisório", to: "/supervisorio", icon: Network },
    ],
  },
  {
    title: "Cadastros",
    items: [
      {
        label: "Clientes",
        to: "/clientes",
        icon: Users,
        children: [
          { label: "Listar", to: "/clientes" },
          { label: "Novo cliente", to: "/clientes/novo" },
        ],
      },
      {
        label: "Usuários",
        to: "/usuarios",
        icon: User,
        children: [
          { label: "Listar", to: "/usuarios" },
          { label: "Novo usuário", to: "/usuarios/novo" },
        ],
      },
      {
        label: "Equipamentos",
        to: "/equipamentos",
        icon: HardDrive,
        children: [
          { label: "Listar", to: "/equipamentos" },
          { label: "Novo equipamento", to: "/equipamentos/novo" },
        ],
      },
      { label: "Empresas", to: "/empresas", icon: Building2 },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { label: "Logs", to: "/relatorios/logs", icon: FileText },
      { label: "Relatório Customizado", to: "/relatorios/customizado", icon: BarChart3 },
      { label: "Relatório de Consumo", to: "/relatorios/consumo", icon: FileBarChart },
      { label: "Relatório de Alertas", to: "/relatorios/alertas", icon: History },
      { label: "Exportação de Dados", to: "/relatorios/exportacao", icon: FileDown },
    ],
  },
];

const linkBase =
  "flex items-center gap-3 rounded-full px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10";
const linkActive = "bg-brand-active font-medium text-white";

function SidebarItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = item.icon;

  if (item.children) {
    return (
      <li>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={`${linkBase} w-full`}
        >
          <Icon size={18} aria-hidden />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            size={16}
            aria-hidden
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        {expanded && (
          <ul className="ml-9 mt-1 space-y-1 border-l border-white/20 pl-3">
            {item.children.map((child) => (
              <li key={child.to}>
                <NavLink
                  to={child.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `block rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 ${
                      isActive ? "font-medium text-white" : ""
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
      >
        <Icon size={18} aria-hidden />
        <span>{item.label}</span>
      </NavLink>
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

        <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <h2 className="mb-1 px-3 text-xs font-semibold text-sky-200">{section.title}</h2>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem key={item.to} item={item} onNavigate={handleNavigate} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
