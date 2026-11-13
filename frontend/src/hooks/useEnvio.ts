import { useState } from "react";
import { ErroApi } from "../api/cliente";

/** Estado de um envio de formulário: "salvando", erro geral e erros por campo vindos da API. */
export function useEnvio() {
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});

  async function executar(acao: () => Promise<void>) {
    setSalvando(true);
    setErroGeral(null);
    setErros({});
    try {
      await acao();
    } catch (e) {
      if (e instanceof ErroApi && e.detalhes.length > 0) {
        setErros(Object.fromEntries(e.detalhes.map((d) => [d.campo, d.mensagem])));
        setErroGeral("Corrija os campos destacados.");
      } else {
        setErroGeral(e instanceof Error ? e.message : "Erro inesperado");
      }
    } finally {
      setSalvando(false);
    }
  }

  return { salvando, erroGeral, erros, executar };
}
