export const VAZIO = "—";

export const txt = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? VAZIO : String(v));

/** 2026-05-04 -> 04/05/2026 */
export const data = (v: string | null | undefined) => (v ? v.split("-").reverse().join("/") : VAZIO);

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const dinheiro = (v: number | null | undefined) => (v === null || v === undefined ? VAZIO : moeda.format(v));

// Conversões de formulário (tudo é string nos inputs): "" vira null.
export const textoOuNulo = (s: string) => (s.trim() === "" ? null : s.trim());
export const numeroOuNulo = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
export const paraCampo = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

/** 2026-11-07T14:30:00Z -> 07/11/2026 11:30 (fuso do navegador) */
export const dataHora = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : VAZIO;

/** Hoje no formato do campo de data (AAAA-MM-DD), no fuso do navegador. */
export const hojeISO = () => new Date().toLocaleDateString("en-CA");
export const DATA_MINIMA = "1990-01-01";
