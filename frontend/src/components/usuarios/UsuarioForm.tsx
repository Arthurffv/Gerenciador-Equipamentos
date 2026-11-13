import { useState } from "react";
import { atualizarUsuario, criarUsuario, rotuloPapel, type Papel, type UsuarioAdm } from "../../api/auth";
import { useAuth } from "../../auth/contexto";
import { useEnvio } from "../../hooks/useEnvio";
import FormularioModal from "../ui/FormularioModal";
import { CampoSelect, CampoTexto } from "../ui/Campos";

type Props = {
  /** null = novo usuário */
  inicial: UsuarioAdm | null;
  onFechar: () => void;
  onSalvo: () => void;
};

const opcoesPapel = (Object.keys(rotuloPapel) as Papel[]).map((p) => ({
  valor: p,
  texto: { ADMIN: "Administrador — tudo, inclusive usuários", EDITOR: "Editor — cadastra, edita e exclui", LEITOR: "Leitor — só consulta" }[p],
}));

export default function UsuarioForm({ inicial, onFechar, onSalvo }: Props) {
  const { usuario: eu } = useAuth();
  const envio = useEnvio();
  const ehEuMesmo = !!inicial && inicial.id === eu?.id;
  const [v, setV] = useState({
    nome: inicial?.nome ?? "",
    email: inicial?.email ?? "",
    papel: (inicial?.papel ?? "LEITOR") as Papel,
    senha: "",
    ativo: inicial?.ativo ?? true,
  });

  async function enviar() {
    const dados = { nome: v.nome.trim(), email: v.email.trim(), papel: v.papel, ...(v.senha ? { senha: v.senha } : {}) };
    if (inicial) await atualizarUsuario(inicial.id, { ...dados, ativo: v.ativo });
    else await criarUsuario({ ...dados, senha: v.senha });
    onSalvo();
  }

  return (
    <FormularioModal titulo={inicial ? `Editar ${inicial.nome}` : "Novo usuário"} onFechar={onFechar} onEnviar={enviar} envio={envio}>
      <CampoTexto rotulo="Nome" obrigatorio autoFocus value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} erro={envio.erros.nome} />
      <CampoTexto rotulo="E-mail" type="email" obrigatorio value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} erro={envio.erros.email} />
      <CampoSelect
        className="sm:col-span-2"
        rotulo="Perfil de acesso"
        value={v.papel}
        disabled={ehEuMesmo}
        onChange={(e) => setV({ ...v, papel: e.target.value as Papel })}
        opcoes={opcoesPapel}
        dica={ehEuMesmo ? "Você não pode mudar o seu próprio perfil." : undefined}
        erro={envio.erros.papel}
      />
      <CampoTexto
        className="sm:col-span-2"
        rotulo={inicial ? "Nova senha" : "Senha"}
        type="password"
        autoComplete="new-password"
        obrigatorio={!inicial}
        value={v.senha}
        onChange={(e) => setV({ ...v, senha: e.target.value })}
        erro={envio.erros.senha}
        dica={inicial ? "Deixe em branco para manter a atual. Mínimo 8 caracteres." : "Mínimo 8 caracteres. Passe a senha à pessoa por um canal seguro; ela pode trocá-la depois."}
      />
      {inicial && (
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={v.ativo} disabled={ehEuMesmo} onChange={(e) => setV({ ...v, ativo: e.target.checked })} />
          Usuário ativo (desmarque para bloquear o acesso)
          {ehEuMesmo && <span className="text-xs text-slate-500">— não vale para você mesmo</span>}
        </label>
      )}
    </FormularioModal>
  );
}
