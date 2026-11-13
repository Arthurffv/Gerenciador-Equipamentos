import { useState } from "react";
import { atualizarManutencao, criarManutencao, type ManutencaoDetalhe, type TipoManutencao } from "../../api/equipamentos";
import { useEnvio } from "../../hooks/useEnvio";
import { DATA_MINIMA, hojeISO, numeroOuNulo, paraCampo, textoOuNulo } from "../../utils/formatar";
import FormularioModal from "../ui/FormularioModal";
import { CampoSelect, CampoTexto, CampoTextarea } from "../ui/Campos";

type Props = {
  equipamentoId: string;
  inicial: ManutencaoDetalhe | null;
  onFechar: () => void;
  onSalvo: () => void;
};

export default function ManutencaoForm({ equipamentoId, inicial, onFechar, onSalvo }: Props) {
  const envio = useEnvio();
  const [v, setV] = useState({
    tipo: (inicial?.tipo ?? "PREVENTIVA") as TipoManutencao,
    dataManutencao: paraCampo(inicial?.dataManutencao),
    periodicidadeMeses: paraCampo(inicial?.periodicidadeMeses),
    proximaManutencao: paraCampo(inicial?.proximaManutencao),
    responsavel: paraCampo(inicial?.responsavel),
    custo: paraCampo(inicial?.custo),
    descricao: paraCampo(inicial?.descricao),
  });
  const set = <K extends keyof typeof v>(campo: K) => (valor: (typeof v)[K]) => setV((x) => ({ ...x, [campo]: valor }));

  async function enviar() {
    const dados = {
      tipo: v.tipo,
      dataManutencao: v.dataManutencao,
      periodicidadeMeses: numeroOuNulo(v.periodicidadeMeses),
      proximaManutencao: textoOuNulo(v.proximaManutencao),
      responsavel: textoOuNulo(v.responsavel),
      descricao: textoOuNulo(v.descricao),
      custo: numeroOuNulo(v.custo),
    };
    if (inicial) await atualizarManutencao(inicial.id, dados);
    else await criarManutencao(equipamentoId, dados);
    onSalvo();
  }

  return (
    <FormularioModal titulo={inicial ? "Editar manutenção" : "Nova manutenção"} onFechar={onFechar} onEnviar={enviar} envio={envio}>
      <CampoTexto rotulo="Data da manutenção" type="date" min={DATA_MINIMA} max={hojeISO()} obrigatorio value={v.dataManutencao} onChange={(e) => set("dataManutencao")(e.target.value)} erro={envio.erros.dataManutencao} autoFocus />
      <CampoSelect
        rotulo="Tipo"
        value={v.tipo}
        onChange={(e) => set("tipo")(e.target.value as TipoManutencao)}
        opcoes={[
          { valor: "PREVENTIVA", texto: "Preventiva" },
          { valor: "CORRETIVA", texto: "Corretiva" },
        ]}
      />
      <CampoTexto rotulo="Periodicidade (meses)" type="number" min={1} step={1} value={v.periodicidadeMeses} onChange={(e) => set("periodicidadeMeses")(e.target.value)} erro={envio.erros.periodicidadeMeses} />
      <CampoTexto rotulo="Próxima manutenção" type="date" value={v.proximaManutencao} onChange={(e) => set("proximaManutencao")(e.target.value)} erro={envio.erros.proximaManutencao} dica="Em branco: calculada pela data + periodicidade." />
      <CampoTexto rotulo="Responsável" value={v.responsavel} onChange={(e) => set("responsavel")(e.target.value)} erro={envio.erros.responsavel} />
      <CampoTexto rotulo="Custo (R$)" type="number" min={0} step="0.01" value={v.custo} onChange={(e) => set("custo")(e.target.value)} erro={envio.erros.custo} />
      <CampoTextarea className="sm:col-span-2" rotulo="Descrição do serviço" value={v.descricao} onChange={(e) => set("descricao")(e.target.value)} erro={envio.erros.descricao} />
    </FormularioModal>
  );
}
