import { TAMANHO_MAXIMO_MB } from "../components/ui/CampoArquivo";

/** Barra o arquivo grande demais ANTES de salvar o registro (evita ficar com o registro salvo e o arquivo recusado). */
export function validarArquivo(arquivo: File | null) {
  if (arquivo && arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    throw new Error(`O arquivo passa de ${TAMANHO_MAXIMO_MB} MB. Escolha um menor.`);
  }
}

/**
 * Depois que o registro foi salvo: envia o arquivo novo ou remove o atual, conforme o usuário escolheu.
 * Se falhar, devolve um aviso (o registro já está salvo) em vez de lançar erro.
 */
export async function sincronizarArquivo(opcoes: {
  novo: File | null;
  remover: boolean;
  jaTinha: boolean;
  enviar: (arquivo: File) => Promise<void>;
  apagar: () => Promise<unknown>;
  aviso: string;
}): Promise<string | undefined> {
  try {
    if (opcoes.novo) await opcoes.enviar(opcoes.novo);
    else if (opcoes.remover && opcoes.jaTinha) await opcoes.apagar();
  } catch (e) {
    return `${opcoes.aviso} (${e instanceof Error ? e.message : "erro desconhecido"}).`;
  }
  return undefined;
}
