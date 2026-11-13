/** "Venceu há 3 dias" / "Vence hoje" / "Vence em 13 dias" a partir dos dias restantes (negativo = atrasado). */
export function textoPrazo(dias: number): string {
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `vence em ${dias} dias`;
  if (dias === -1) return "venceu ontem";
  return `venceu há ${-dias} dias`;
}
