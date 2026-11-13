import { useState } from "react";
import {
  atualizarAnalise,
  criarAnalise,
  enviarArquivoAnalise,
  removerArquivoAnalise,
  type AnaliseDetalhe,
} from "../../api/equipamentos";
import { useEnvio } from "../../hooks/useEnvio";
import { sincronizarArquivo, validarArquivo } from "../../utils/anexo";
import { DATA_MINIMA, hojeISO, paraCampo, textoOuNulo } from "../../utils/formatar";
import FormularioModal from "../ui/FormularioModal";
import CampoArquivo from "../ui/CampoArquivo";
import { CampoSelect, CampoTexto, CampoTextarea } from "../ui/Campos";

type Props = {
  equipamentoId: string;
  inicial: AnaliseDetalhe | null;
  onFechar: () => void;
  /** `aviso` vem preenchido se a análise foi salva mas o arquivo falhou. */
  onSalvo: (aviso?: string) => void;
};

export default function AnaliseForm({ equipamentoId, inicial, onFechar, onSalvo }: Props) {
  const envio = useEnvio();
  const [v, setV] = useState({
    dataAnalise: paraCampo(inicial?.dataAnalise),
    analista: paraCampo(inicial?.analista),
    conforme: inicial ? String(inicial.conforme) : "true",
    parecer: paraCampo(inicial?.parecer),
    acaoNecessaria: paraCampo(inicial?.acaoNecessaria),
  });
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [removerArquivo, setRemoverArquivo] = useState(false);
  const set = <K extends keyof typeof v>(campo: K) => (valor: string) => setV((x) => ({ ...x, [campo]: valor }));

  async function enviar() {
    validarArquivo(novoArquivo);
    const dados = {
      dataAnalise: v.dataAnalise,
      analista: v.analista.trim(),
      parecer: v.parecer.trim(),
      conforme: v.conforme === "true",
      acaoNecessaria: textoOuNulo(v.acaoNecessaria),
    };
    const salva = inicial ? await atualizarAnalise(inicial.id, dados) : await criarAnalise(equipamentoId, dados);

    const aviso = await sincronizarArquivo({
      novo: novoArquivo,
      remover: removerArquivo,
      jaTinha: !!inicial?.arquivoNome,
      enviar: (f) => enviarArquivoAnalise(salva.id, f),
      apagar: () => removerArquivoAnalise(salva.id),
      aviso: "Análise crítica salva, mas o documento não foi atualizado. Edite a análise para tentar de novo",
    });
    onSalvo(aviso);
  }

  return (
    <FormularioModal titulo={inicial ? "Editar análise crítica" : "Nova análise crítica"} onFechar={onFechar} onEnviar={enviar} envio={envio}>
      <CampoTexto rotulo="Data da análise" type="date" min={DATA_MINIMA} max={hojeISO()} obrigatorio value={v.dataAnalise} onChange={(e) => set("dataAnalise")(e.target.value)} erro={envio.erros.dataAnalise} autoFocus />
      <CampoTexto rotulo="Analista" obrigatorio value={v.analista} onChange={(e) => set("analista")(e.target.value)} erro={envio.erros.analista} />
      <CampoSelect
        rotulo="Resultado da análise"
        value={v.conforme}
        onChange={(e) => set("conforme")(e.target.value)}
        opcoes={[
          { valor: "true", texto: "Conforme" },
          { valor: "false", texto: "Não conforme" },
        ]}
      />
      <span className="hidden sm:block" />
      <CampoTextarea className="sm:col-span-2" rotulo="Parecer" obrigatorio rows={4} value={v.parecer} onChange={(e) => set("parecer")(e.target.value)} erro={envio.erros.parecer} />
      <CampoTextarea className="sm:col-span-2" rotulo="Ação necessária" value={v.acaoNecessaria} onChange={(e) => set("acaoNecessaria")(e.target.value)} erro={envio.erros.acaoNecessaria} dica="Preencha se a análise exigir alguma providência." />
      <CampoArquivo
        rotulo="Documento da análise"
        atual={inicial?.arquivoNome ?? null}
        novo={novoArquivo}
        onNovo={setNovoArquivo}
        remover={removerArquivo}
        onRemover={setRemoverArquivo}
      />
    </FormularioModal>
  );
}
