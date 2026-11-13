import { useState } from "react";
import { atualizarEquipamento, criarEquipamento, type EquipamentoBase, type Qualificacao, type StatusEquipamento } from "../../api/equipamentos";
import { useEnvio } from "../../hooks/useEnvio";
import { paraCampo, textoOuNulo } from "../../utils/formatar";
import FormularioModal from "../ui/FormularioModal";
import { CampoSelect, CampoTexto, CampoTextarea } from "../ui/Campos";

type Props = {
  /** slug do setor (campo, laboratorio, vidrarias), usado ao criar */
  setor: string;
  /** null = novo equipamento */
  inicial: EquipamentoBase | null;
  onFechar: () => void;
  onSalvo: () => void;
};

export default function EquipamentoForm({ setor, inicial, onFechar, onSalvo }: Props) {
  const envio = useEnvio();
  const [v, setV] = useState({
    codigo: paraCampo(inicial?.codigo),
    nome: paraCampo(inicial?.nome),
    amostrador: paraCampo(inicial?.amostrador),
    numeroSerie: paraCampo(inicial?.numeroSerie),
    modelo: paraCampo(inicial?.modelo),
    fabricante: paraCampo(inicial?.fabricante),
    qualificacao: (inicial?.qualificacao ?? "CRITICO") as Qualificacao,
    status: (inicial?.status ?? "USO") as StatusEquipamento,
    localizacaoAtual: paraCampo(inicial?.localizacaoAtual),
    observacoes: paraCampo(inicial?.observacoes),
  });
  const set = <K extends keyof typeof v>(campo: K) => (valor: (typeof v)[K]) => setV((x) => ({ ...x, [campo]: valor }));

  async function enviar() {
    const dados = {
      codigo: v.codigo.trim(),
      nome: v.nome.trim(),
      amostrador: textoOuNulo(v.amostrador),
      numeroSerie: textoOuNulo(v.numeroSerie),
      modelo: textoOuNulo(v.modelo),
      fabricante: textoOuNulo(v.fabricante),
      qualificacao: v.qualificacao,
      status: v.status,
      localizacaoAtual: textoOuNulo(v.localizacaoAtual),
      observacoes: textoOuNulo(v.observacoes),
    };
    if (inicial) await atualizarEquipamento(inicial.id, dados);
    else await criarEquipamento(setor, dados);
    onSalvo();
  }

  return (
    <FormularioModal titulo={inicial ? `Editar ${inicial.codigo}` : "Novo equipamento"} onFechar={onFechar} onEnviar={enviar} envio={envio}>
      <CampoTexto rotulo="Código" obrigatorio value={v.codigo} onChange={(e) => set("codigo")(e.target.value)} erro={envio.erros.codigo} dica="Único dentro do setor. Ex.: AQAN 003" autoFocus />
      <CampoTexto rotulo="Equipamento" obrigatorio value={v.nome} onChange={(e) => set("nome")(e.target.value)} erro={envio.erros.nome} dica="Tipo: Anemômetro, Autoclave..." />
      <CampoTexto rotulo="Amostrador" value={v.amostrador} onChange={(e) => set("amostrador")(e.target.value)} erro={envio.erros.amostrador} />
      <CampoTexto rotulo="Nº de série" value={v.numeroSerie} onChange={(e) => set("numeroSerie")(e.target.value)} erro={envio.erros.numeroSerie} />
      <CampoTexto rotulo="Modelo" value={v.modelo} onChange={(e) => set("modelo")(e.target.value)} erro={envio.erros.modelo} />
      <CampoTexto rotulo="Fabricante" value={v.fabricante} onChange={(e) => set("fabricante")(e.target.value)} erro={envio.erros.fabricante} />
      <CampoSelect
        rotulo="Qualificação"
        value={v.qualificacao}
        onChange={(e) => set("qualificacao")(e.target.value as Qualificacao)}
        opcoes={[
          { valor: "CRITICO", texto: "Crítico" },
          { valor: "NAO_CRITICO", texto: "Não crítico" },
        ]}
      />
      <CampoSelect
        rotulo="Status do equipamento"
        value={v.status}
        onChange={(e) => set("status")(e.target.value as StatusEquipamento)}
        opcoes={[
          { valor: "USO", texto: "Em uso" },
          { valor: "FORA_DE_USO", texto: "Fora de uso" },
          { valor: "MANUTENCAO", texto: "Em manutenção" },
          { valor: "OBSOLETO", texto: "Obsoleto" },
        ]}
      />
      <CampoTexto className="sm:col-span-2" rotulo="Localização atual" value={v.localizacaoAtual} onChange={(e) => set("localizacaoAtual")(e.target.value)} erro={envio.erros.localizacaoAtual} />
      <CampoTextarea className="sm:col-span-2" rotulo="Observações" value={v.observacoes} onChange={(e) => set("observacoes")(e.target.value)} erro={envio.erros.observacoes} />
    </FormularioModal>
  );
}
