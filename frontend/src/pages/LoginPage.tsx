import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/contexto";
import { useEnvio } from "../hooks/useEnvio";
import { CampoTexto } from "../components/ui/Campos";
import Botao from "../components/ui/Botao";

export default function LoginPage() {
  const { usuario, carregando, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const envio = useEnvio();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const destino = (local.state as { de?: string } | null)?.de ?? "/";
  if (!carregando && usuario) return <Navigate to={destino} replace />;

  return (
    <main className="grid min-h-screen place-items-center bg-brand px-4 font-sans text-slate-800">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="grid h-32 place-items-center border-b border-slate-100">
          <img src="/logo.svg" alt="Logotipo da empresa" className="max-h-20 max-w-[60%]" />
        </div>

        <form
          className="space-y-4 px-8 py-7"
          onSubmit={(e) => {
            e.preventDefault();
            void envio.executar(async () => {
              await entrar(email, senha);
              navegar(destino, { replace: true });
            });
          }}
        >
          <div>
            <h1 className="text-xl font-bold text-brand">Entrar</h1>
            <p className="text-sm text-slate-500">Gestão de equipamentos</p>
          </div>

          <CampoTexto rotulo="E-mail" type="email" autoComplete="username" obrigatorio autoFocus value={email} onChange={(e) => setEmail(e.target.value)} erro={envio.erros.email} />
          <CampoTexto rotulo="Senha" type="password" autoComplete="current-password" obrigatorio value={senha} onChange={(e) => setSenha(e.target.value)} erro={envio.erros.senha} />

          {envio.erroGeral && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {envio.erroGeral}
            </p>
          )}

          <Botao type="submit" className="w-full" disabled={envio.salvando}>
            {envio.salvando ? "Entrando..." : "Entrar"}
          </Botao>
        </form>
      </div>
    </main>
  );
}
