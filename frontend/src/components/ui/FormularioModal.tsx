import type { ReactNode } from "react";
import Modal from "./Modal";
import Botao from "./Botao";
import type { useEnvio } from "../../hooks/useEnvio";

type FormularioModalProps = {
  titulo: string;
  onFechar: () => void;
  /** Roda ao enviar o formulário. Se lançar erro, ele aparece no modal e o modal continua aberto. */
  onEnviar: () => Promise<void>;
  envio: ReturnType<typeof useEnvio>;
  children: ReactNode;
};

/** Modal com formulário em duas colunas, erro geral e botões Cancelar / Salvar. */
export default function FormularioModal({ titulo, onFechar, onEnviar, envio, children }: FormularioModalProps) {
  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          void envio.executar(onEnviar);
        }}
      >
        <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">{children}</div>

        <div className="space-y-3 border-t border-slate-200 px-6 py-4">
          {envio.erroGeral && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {envio.erroGeral}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Botao variante="secundario" onClick={onFechar} disabled={envio.salvando}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={envio.salvando}>
              {envio.salvando ? "Salvando..." : "Salvar"}
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  );
}
