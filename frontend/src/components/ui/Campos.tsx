import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const entrada =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

/** Atributos que o controle recebe para ficar ligado ao rótulo, à dica e ao erro. */
type PropsControle = { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined };

type CampoProps = {
  rotulo: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  className?: string;
  children: (controle: PropsControle) => ReactNode;
};

/**
 * Rótulo + controle + dica/erro. O rótulo contém só o nome do campo; a dica e o erro
 * ficam fora dele e são lidos como descrição (aria-describedby).
 */
export function Campo({ rotulo, erro, dica, obrigatorio, className = "", children }: CampoProps) {
  const id = useId();
  const idMensagem = `${id}-msg`;
  const mensagem = erro ?? dica;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {rotulo}
        {obrigatorio && (
          <span aria-hidden className="text-red-600">
            {" "}
            *
          </span>
        )}
      </label>
      {children({ id, "aria-invalid": !!erro, "aria-describedby": mensagem ? idMensagem : undefined })}
      {mensagem && (
        <p id={idMensagem} className={`mt-1 text-xs ${erro ? "font-medium text-red-600" : "text-slate-500"}`}>
          {mensagem}
        </p>
      )}
    </div>
  );
}

type Base = Omit<CampoProps, "children">;
const classe = (erro?: string) => `${entrada} ${erro ? "border-red-400" : ""}`;

export function CampoTexto({ rotulo, erro, dica, obrigatorio, className, ...input }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Campo {...{ rotulo, erro, dica, obrigatorio, className }}>
      {(c) => <input {...input} {...c} required={obrigatorio} className={classe(erro)} />}
    </Campo>
  );
}

export function CampoSelect({
  rotulo,
  erro,
  dica,
  obrigatorio,
  className,
  opcoes,
  ...select
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { opcoes: { valor: string; texto: string }[] }) {
  return (
    <Campo {...{ rotulo, erro, dica, obrigatorio, className }}>
      {(c) => (
        <select {...select} {...c} required={obrigatorio} className={classe(erro)}>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      )}
    </Campo>
  );
}

export function CampoTextarea({ rotulo, erro, dica, obrigatorio, className, ...area }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Campo {...{ rotulo, erro, dica, obrigatorio, className }}>
      {(c) => <textarea rows={3} {...area} {...c} required={obrigatorio} className={classe(erro)} />}
    </Campo>
  );
}
