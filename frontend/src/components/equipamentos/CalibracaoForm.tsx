import { useState } from "react";
import {
  atualizarCalibracao,
  criarCalibracao,
  enviarCertificado,
  removerCertificado,
  type CalibracaoDetalhe,
  type ResultadoCalibracao,
} from "../../api/equipamentos";
import { useEnvio } from "../../hooks/useEnvio";
import { sincronizarArquivo, validarArquivo } from "../../utils/anexo";
import { DATA_MINIMA, hojeISO, numeroOuNulo, paraCampo, textoOuNulo } from "../../utils/formatar";
import FormularioModal from "../ui/FormularioModal";
import CampoArquivo from "../ui/CampoArquivo";
import { CampoSelect, CampoTexto, CampoTextarea } from "../ui/Campos";

type Props = {
  equipamentoId: string;
  inicial: CalibracaoDetalhe | null;
  onFechar: () => void;
  /** `aviso` vem preenchido se a calibração foi salva mas o certificado falhou. */
  onSalvo: (aviso?: string) => void;
};

export default function CalibracaoForm({ equipamentoId, inicial, onFechar, onSalvo }: Props) {
  const envio = useEnvio();
  const [v, setV] = useState({
    numeroCertificado: paraCampo(inicial?.numeroCertificado),
    escala: paraCampo(inicial?.escala),
    faixaCalibracao: paraCampo(inicial?.faixaCalibracao),
    dataCalibracao: paraCampo(inicial?.dataCalibracao),
    intervaloMeses: paraCampo(inicial?.intervaloMeses),
    proximaCalibracao: paraCampo(inicial?.proximaCalibracao),
    erroMaximo: paraCampo(inicial?.erroMaximo),
    normasReferencia: paraCampo(inicial?.normasReferencia),
    laboratorio: paraCampo(inicial?.laboratorio),
    resultado: paraCampo(inicial?.resultado),
    observacoes: paraCampo(inicial?.observacoes),
  });
  const [novoArquivo, setNovoArquivo] = useState<File | null>(null);
  const [removerArquivo, setRemoverArquivo] = useState(false);
  const set = <K extends keyof typeof v>(campo: K) => (valor: string) => setV((x) => ({ ...x, [campo]: valor }));

  async function enviar() {
    validarArquivo(novoArquivo);
    const dados = {
      numeroCertificado: textoOuNulo(v.numeroCertificado),
      escala: textoOuNulo(v.escala),
      faixaCalibracao: textoOuNulo(v.faixaCalibracao),
      dataCalibracao: textoOuNulo(v.dataCalibracao),
      intervaloMeses: numeroOuNulo(v.intervaloMeses),
      proximaCalibracao: textoOuNulo(v.proximaCalibracao),
      erroMaximo: textoOuNulo(v.erroMaximo),
      normasReferencia: textoOuNulo(v.normasReferencia),
      laboratorio: textoOuNulo(v.laboratorio),
      resultado: textoOuNulo(v.resultado) as ResultadoCalibracao | null,
      observacoes: textoOuNulo(v.observacoes),
    };
    const salva = inicial ? await atualizarCalibracao(inicial.id, dados) : await criarCalibracao(equipamentoId, dados);

    const aviso = await sincronizarArquivo({
      novo: novoArquivo,
      remover: removerArquivo,
      jaTinha: !!inicial?.certificadoNome,
      enviar: (f) => enviarCertificado(salva.id, f),
      apagar: () => removerCertificado(salva.id),
      aviso: "Calibração salva, mas o certificado não foi atualizado. Edite a calibração para tentar de novo",
    });
    onSalvo(aviso);
  }

  return (
    <FormularioModal titulo={inicial ? "Editar calibração" : "Nova calibração"} onFechar={onFechar} onEnviar={enviar} envio={envio}>
      <CampoTexto rotulo="Data da calibração" type="date" min={DATA_MINIMA} max={hojeISO()} value={v.dataCalibracao} onChange={(e) => set("dataCalibracao")(e.target.value)} erro={envio.erros.dataCalibracao} dica="Informe a data ou o nº do certificado." autoFocus />
      <CampoTexto rotulo="Nº do certificado" value={v.numeroCertificado} onChange={(e) => set("numeroCertificado")(e.target.value)} erro={envio.erros.numeroCertificado} />
      <CampoTexto rotulo="Intervalo (meses)" type="number" min={1} step={1} value={v.intervaloMeses} onChange={(e) => set("intervaloMeses")(e.target.value)} erro={envio.erros.intervaloMeses} />
      <CampoTexto rotulo="Próxima calibração" type="date" value={v.proximaCalibracao} onChange={(e) => set("proximaCalibracao")(e.target.value)} erro={envio.erros.proximaCalibracao} dica="Em branco: calculada pela data + intervalo." />
      <CampoTexto rotulo="Escala" value={v.escala} onChange={(e) => set("escala")(e.target.value)} erro={envio.erros.escala} />
      <CampoTexto rotulo="Faixa de calibração" value={v.faixaCalibracao} onChange={(e) => set("faixaCalibracao")(e.target.value)} erro={envio.erros.faixaCalibracao} />
      <CampoTexto rotulo="Erro máximo" value={v.erroMaximo} onChange={(e) => set("erroMaximo")(e.target.value)} erro={envio.erros.erroMaximo} />
      <CampoTexto rotulo="Laboratório" value={v.laboratorio} onChange={(e) => set("laboratorio")(e.target.value)} erro={envio.erros.laboratorio} />
      <CampoTexto className="sm:col-span-2" rotulo="Normas de referência" value={v.normasReferencia} onChange={(e) => set("normasReferencia")(e.target.value)} erro={envio.erros.normasReferencia} />
      <CampoSelect
        rotulo="Resultado"
        value={v.resultado}
        onChange={(e) => set("resultado")(e.target.value)}
        opcoes={[
          { valor: "", texto: "Não informado" },
          { valor: "APROVADA", texto: "Aprovada" },
          { valor: "APROVADA_COM_RESTRICAO", texto: "Aprovada com restrição" },
          { valor: "REPROVADA", texto: "Reprovada" },
        ]}
      />
      <span className="hidden sm:block" />
      <CampoTextarea className="sm:col-span-2" rotulo="Observações" value={v.observacoes} onChange={(e) => set("observacoes")(e.target.value)} erro={envio.erros.observacoes} />
      <CampoArquivo
        rotulo="Certificado"
        atual={inicial?.certificadoNome ?? null}
        novo={novoArquivo}
        onNovo={setNovoArquivo}
        remover={removerArquivo}
        onRemover={setRemoverArquivo}
      />
    </FormularioModal>
  );
}
