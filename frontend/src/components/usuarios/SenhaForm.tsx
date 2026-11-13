import { useState } from "react";
import { trocarSenha } from "../../api/auth";
import { useEnvio } from "../../hooks/useEnvio";
import FormularioModal from "../ui/FormularioModal";
import { CampoTexto } from "../ui/Campos";

/** Cada pessoa troca a própria senha (precisa informar a atual). */
export default function SenhaForm({ onFechar }: { onFechar: () => void }) {
  const envio = useEnvio();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [feito, setFeito] = useState(false);

  async function enviar() {
    if (nova !== confirmacao) throw new Error("A confirmação não é igual à nova senha.");
    await trocarSenha(atual, nova);
    setFeito(true);
  }

  if (feito) {
    return (
      <FormularioModal titulo="Alterar minha senha" onFechar={onFechar} onEnviar={async () => onFechar()} envio={envio}>
        <p className="text-sm text-slate-700 sm:col-span-2">Senha alterada. Use a nova senha no próximo login.</p>
      </FormularioModal>
    );
  }

  return (
    <FormularioModal titulo="Alterar minha senha" onFechar={onFechar} onEnviar={enviar} envio={envio}>
      <CampoTexto className="sm:col-span-2" rotulo="Senha atual" type="password" autoComplete="current-password" obrigatorio autoFocus value={atual} onChange={(e) => setAtual(e.target.value)} erro={envio.erros.senhaAtual} />
      <CampoTexto rotulo="Nova senha" type="password" autoComplete="new-password" obrigatorio value={nova} onChange={(e) => setNova(e.target.value)} erro={envio.erros.novaSenha} dica="Mínimo 8 caracteres." />
      <CampoTexto rotulo="Repita a nova senha" type="password" autoComplete="new-password" obrigatorio value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
    </FormularioModal>
  );
}
