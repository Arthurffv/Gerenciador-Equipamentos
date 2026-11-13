import { buscarEquipamentos, buscarEquipamento } from "../api/equipamentos";
import { useCarregar } from "./useCarregar";

/** Lista de equipamentos de um setor (alimenta as abas Geral, Calibração e Manutenção). */
export function useEquipamentos(setor: string | undefined) {
  const { dados, ...resto } = useCarregar(setor, (signal) => buscarEquipamentos(setor!, signal));
  return { dados: dados ?? [], ...resto };
}

/** Um equipamento com todo o histórico (calibrações, manutenções, análises críticas). */
export function useEquipamento(id: string | undefined) {
  return useCarregar(id, (signal) => buscarEquipamento(id!, signal));
}
