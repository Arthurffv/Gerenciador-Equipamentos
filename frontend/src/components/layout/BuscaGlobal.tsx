import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { buscarPorTexto } from "../../api/painel";
import { setores } from "../../config/setores";
import { useAtrasado } from "../../hooks/useAtrasado";
import { useCarregar } from "../../hooks/useCarregar";
import { useFecharFora } from "../../hooks/useFecharFora";

const rotuloSetor = (slug: string) => setores.find((s) => s.slug === slug)?.label ?? slug;

/** Busca em todos os setores (nome, código, série, modelo, fabricante); abre o equipamento escolhido. */
export default function BuscaGlobal() {
  const navegar = useNavigate();
  const raiz = useRef<HTMLDivElement>(null);
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const limpo = termo.trim();
  const atrasado = useAtrasado(limpo);
  const consultaValida = atrasado.length >= 2;
  const { dados, carregando, erro } = useCarregar(consultaValida ? atrasado : undefined, (s) => buscarPorTexto(atrasado, s));
  const fechar = () => setAberto(false);
  useFecharFora(raiz, aberto, fechar);

  const mostrar = aberto && limpo.length >= 2;
  const aguardando = carregando || atrasado !== limpo;

  function limpar() {
    setAberto(false);
    setTermo("");
  }

  function ir(id: string) {
    limpar();
    navegar(`/equipamentos/${id}`);
  }

  return (
    <div ref={raiz} className="relative w-full max-w-sm">
      <label className="relative block">
        <span className="sr-only">Pesquisar equipamentos em todos os setores</span>
        <Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={async (e) => {
            // Enter busca na hora (sem esperar o atraso da digitação) e abre o primeiro resultado
            if (e.key !== "Enter" || limpo.length < 2) return;
            const resultados = await buscarPorTexto(limpo).catch(() => []);
            if (resultados[0]) ir(resultados[0].id);
          }}
          placeholder="Pesquisar equipamentos..."
          aria-expanded={mostrar}
          className="w-full rounded-full bg-slate-200/70 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </label>

      {mostrar && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {erro ? (
            <p role="alert" className="px-4 py-3 text-sm text-red-700">{erro}</p>
          ) : aguardando ? (
            <p className="px-4 py-3 text-sm text-slate-500">Buscando...</p>
          ) : dados && dados.length > 0 ? (
            <ul aria-label="Resultados da busca">
              {dados.map((r) => (
                <li key={r.id}>
                  <Link to={`/equipamentos/${r.id}`} onClick={limpar} className="block px-4 py-2.5 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none">
                    <span className="block text-sm font-medium text-slate-800">{r.nome}</span>
                    <span className="block text-xs text-slate-500">
                      {[r.codigo, rotuloSetor(r.setor), r.modelo, r.fabricante].filter(Boolean).join(" • ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-slate-500">Nenhum equipamento encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
