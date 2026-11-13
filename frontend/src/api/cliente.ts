// A API usa o mesmo nome de host da página (localhost ou 127.0.0.1) para o cookie de sessão valer:
// para o navegador, localhost e 127.0.0.1 são "sites" diferentes e ele descartaria o cookie.
// Em produção, defina VITE_API_URL no build.
export const API_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3001`;

export type DetalheErro = { campo: string; mensagem: string };

/** Erro devolvido pela API ({ erro, detalhes? }) ou falha de conexão. */
export class ErroApi extends Error {
  status: number;
  detalhes: DetalheErro[];

  constructor(mensagem: string, status = 0, detalhes: DetalheErro[] = []) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

// Quando a API responde 401 numa tela já logada (sessão expirou, usuário desativado...),
// quem controla a sessão (AuthProvider) é avisado e manda o usuário para o login.
let aoNaoAutorizado: (() => void) | null = null;
export const definirAoNaoAutorizado = (fn: (() => void) | null) => {
  aoNaoAutorizado = fn;
};

async function tratar(resposta: Response): Promise<void> {
  if (resposta.ok) return;
  let corpo: { erro?: string; detalhes?: DetalheErro[] } = {};
  try {
    corpo = await resposta.json();
  } catch {
    // resposta sem JSON
  }
  throw new ErroApi(corpo.erro ?? `A API respondeu com erro ${resposta.status}`, resposta.status, corpo.detalhes);
}

async function fetchApi(caminho: string, init: RequestInit): Promise<Response> {
  try {
    // credentials: "include" faz o navegador enviar o cookie de sessão à API (outra porta)
    const resposta = await fetch(`${API_URL}${caminho}`, { ...init, credentials: "include" });
    if (resposta.status === 401 && !caminho.startsWith("/api/auth/")) aoNaoAutorizado?.();
    await tratar(resposta);
    return resposta;
  } catch (e) {
    if (e instanceof TypeError) {
      throw new ErroApi("Não foi possível conectar à API. O backend está rodando (npm run dev)?");
    }
    throw e;
  }
}

export async function requisicao<T = void>(
  metodo: "GET" | "POST" | "PUT" | "DELETE",
  caminho: string,
  corpo?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const resposta = await fetchApi(caminho, {
    method: metodo,
    signal,
    headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return resposta.status === 204 ? (undefined as T) : resposta.json();
}

/** Envia (ou substitui) um arquivo no campo "arquivo" do multipart. */
export async function enviarArquivo(caminho: string, arquivo: File): Promise<void> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  await fetchApi(caminho, { method: "POST", body: form });
}

/**
 * Pede à API um link temporário do MinIO e abre numa nova aba.
 * A aba é aberta antes da requisição para o navegador não bloquear como pop-up.
 */
export async function abrirArquivo(caminho: string): Promise<void> {
  const aba = window.open("", "_blank");
  try {
    const { url } = await requisicao<{ url: string }>("GET", caminho);
    if (aba) aba.location.href = url;
    else window.location.href = url;
  } catch (e) {
    aba?.close();
    throw e;
  }
}
