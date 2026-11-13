import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, KeyRound, LogOut, Users } from "lucide-react";
import { rotuloPapel } from "../../api/auth";
import { useAuth } from "../../auth/contexto";
import { useFecharFora } from "../../hooks/useFecharFora";
import SenhaForm from "../usuarios/SenhaForm";

const item = "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50";

export default function MenuUsuario() {
  const { usuario, sair, ehAdmin } = useAuth();
  const raiz = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  useFecharFora(raiz, aberto, () => setAberto(false));

  if (!usuario) return null;
  const iniciais = usuario.nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={`Menu de ${usuario.nome}`}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
      >
        <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">{iniciais}</span>
        <ChevronDown size={14} aria-hidden className="text-slate-500" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-20 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-slate-800">{usuario.nome}</p>
            <p className="truncate text-xs text-slate-500">{usuario.email}</p>
            <p className="mt-1 text-xs font-medium text-brand">{rotuloPapel[usuario.papel]}</p>
          </div>
          {ehAdmin && (
            <Link to="/usuarios" onClick={() => setAberto(false)} className={item}>
              <Users size={16} aria-hidden /> Gerenciar usuários
            </Link>
          )}
          <button type="button" className={item} onClick={() => { setAberto(false); setTrocandoSenha(true); }}>
            <KeyRound size={16} aria-hidden /> Alterar minha senha
          </button>
          <button type="button" className={`${item} border-t border-slate-100`} onClick={() => void sair()}>
            <LogOut size={16} aria-hidden /> Sair
          </button>
        </div>
      )}

      {trocandoSenha && <SenhaForm onFechar={() => setTrocandoSenha(false)} />}
    </div>
  );
}
