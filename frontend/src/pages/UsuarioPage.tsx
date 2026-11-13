import { useState } from "react";
import { Pencil, Plus, Users } from "lucide-react";
import { listarUsuarios, rotuloPapel, type UsuarioAdm } from "../api/auth";
import { useAuth } from "../auth/contexto";
import { useCarregar } from "../hooks/useCarregar";
import { dataHora } from "../utils/formatar";
import Botao, { BotaoIcone } from "../components/ui/Botao";
import DataTable, { type Coluna } from "../components/ui/DataTable";
import UsuarioForm from "../components/usuarios/UsuarioForm";

const coresPapel = { ADMIN: "bg-brand/10 text-brand", EDITOR: "bg-sky-100 text-sky-700", LEITOR: "bg-slate-100 text-slate-600" } as const;

export default function UsuariosPage() {
  const { usuario: eu } = useAuth();
  const { dados, carregando, erro, recarregar } = useCarregar("usuarios", (s) => listarUsuarios(s));
  // undefined = fechado; null = novo; objeto = editando
  const [formulario, setFormulario] = useState<UsuarioAdm | null | undefined>(undefined);

  const colunas: Coluna<UsuarioAdm>[] = [
    {
      titulo: "Nome",
      render: (u) => (
        <span className="font-medium">
          {u.nome} {u.id === eu?.id && <span className="font-normal text-slate-500">(você)</span>}
        </span>
      ),
    },
    { titulo: "E-mail", render: (u) => u.email },
    { titulo: "Perfil", render: (u) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${coresPapel[u.papel]}`}>{rotuloPapel[u.papel]}</span> },
    {
      titulo: "Situação",
      render: (u) =>
        u.ativo ? (
          <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Ativo</span>
        ) : (
          <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Bloqueado</span>
        ),
    },
    { titulo: "Último acesso", render: (u) => dataHora(u.ultimoAcesso) },
    {
      titulo: "Ações",
      render: (u) => (
        <BotaoIcone rotulo={`Editar ${u.nome}`} onClick={() => setFormulario(u)}>
          <Pencil size={16} />
        </BotaoIcone>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold text-brand">Usuários</h1>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
          <Users size={18} aria-hidden />
        </span>
        <Botao className="ml-auto" onClick={() => setFormulario(null)}>
          <Plus size={16} aria-hidden /> Novo usuário
        </Botao>
      </div>

      <p className="text-sm text-slate-600">
        <strong>Administrador</strong> faz tudo, inclusive gerenciar usuários. <strong>Editor</strong> cadastra, edita e exclui equipamentos e registros.{" "}
        <strong>Leitor</strong> só consulta e abre os arquivos. Para tirar o acesso de alguém, edite o usuário e desmarque “ativo”.
      </p>

      {carregando && <p className="py-10 text-center text-slate-500">Carregando...</p>}
      {erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
      {dados && <DataTable colunas={colunas} linhas={dados} chave={(u) => u.id} vazio="Nenhum usuário cadastrado." />}

      {formulario !== undefined && (
        <UsuarioForm
          inicial={formulario}
          onFechar={() => setFormulario(undefined)}
          onSalvo={() => {
            setFormulario(undefined);
            recarregar();
          }}
        />
      )}
    </div>
  );
}
