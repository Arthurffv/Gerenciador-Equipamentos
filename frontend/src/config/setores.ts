import { MapPin, FlaskConical, Beaker, type LucideIcon } from "lucide-react";

export type Aba = { slug: string; label: string };

export type Setor = {
  slug: string; // usado na URL: /campo/geral
  label: string;
  icon: LucideIcon;
};

// As 3 abas da planilha FOR 0042 (Geral, Calibração, Manutenção)
export const abas: Aba[] = [
  { slug: "geral", label: "Geral" },
  { slug: "calibracao", label: "Calibração" },
  { slug: "manutencao", label: "Manutenção" },
];

export const setores: Setor[] = [
  { slug: "campo", label: "Campo", icon: MapPin },
  { slug: "laboratorio", label: "Laboratório", icon: FlaskConical },
  { slug: "vidrarias", label: "Vidrarias", icon: Beaker },
];
