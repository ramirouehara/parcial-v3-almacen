"use client";

/** Un filtro desplegable que escribe su valor en la URL (?activo=true), como SearchBox. */
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "todos";

export function UrlSelect({
  param,
  label,
  options,
}: {
  param: string;
  label: string;
  options: { value: string; label: string }[];
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
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
