"use client";

/** Un filtro desplegable que escribe su valor en la URL (?activo=true), como SearchBox. */
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Valor interno de la opción "sin filtro" (no puede chocar con un valor real).
const ALL = "__all__";

export function UrlSelect({
  param,
  label,
  options,
  allLabel,
}: {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Texto de la opción sin filtro; por defecto "<label>: todos". */
  allLabel?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function change(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) params.delete(param);
    else params.set(param, value);
    params.delete("page");
    router.replace(`?${params.toString()}`);
  }

  return (
    <Select value={searchParams.get(param) ?? ALL} onValueChange={change}>
      <SelectTrigger className="w-full sm:w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel ?? `${label}: todos`}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
