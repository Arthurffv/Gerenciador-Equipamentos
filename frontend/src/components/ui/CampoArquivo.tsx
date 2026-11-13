import { Campo } from "./Campos";

export const TAMANHO_MAXIMO_MB = 20;
const ACEITOS = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx";

type CampoArquivoProps = {
  rotulo: string;
  /** Nome do arquivo já guardado no servidor (null se não houver). */
  atual: string | null;
  novo: File | null;
  onNovo: (arquivo: File | null) => void;
  remover: boolean;
  onRemover: (remover: boolean) => void;
  erro?: string;
};

/** Anexo de um registro: mostra o arquivo atual, permite trocar ou remover. O envio acontece ao salvar o formulário. */
export default function CampoArquivo({ rotulo, atual, novo, onNovo, remover, onRemover, erro }: CampoArquivoProps) {
  const aviso =
    novo && novo.size > TAMANHO_MAXIMO_MB * 1024 * 1024 ? `O arquivo passa de ${TAMANHO_MAXIMO_MB} MB e não será aceito.` : erro;

  return (
    <div className="space-y-2 sm:col-span-2">
      <Campo rotulo={rotulo} erro={aviso} dica={`PDF, imagem, Word ou Excel, até ${TAMANHO_MAXIMO_MB} MB.`}>
        {(c) => (
          <input
            {...c}
            type="file"
            accept={ACEITOS}
            onChange={(e) => {
              onNovo(e.target.files?.[0] ?? null);
              if (e.target.files?.[0]) onRemover(false);
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
          />
        )}
      </Campo>

      {atual && (
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-slate-600">
          <span>
            Arquivo atual: <strong className="font-medium">{atual}</strong>
            {novo && " (será substituído pelo novo)"}
            {remover && " (será removido)"}
          </span>
          {!novo && (
            <label className="flex items-center gap-1.5 text-red-700">
              <input type="checkbox" checked={remover} onChange={(e) => onRemover(e.target.checked)} />
              Remover ao salvar
            </label>
          )}
        </p>
      )}
    </div>
  );
}
