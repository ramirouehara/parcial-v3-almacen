"use client";

/**
 * Buscador de productos de la venta (RF-V3, §8 Venta ágil), operable con teclado:
 * escribís código o descripción, ↑/↓ para elegir, Enter para agregar.
 * Con el buscador vacío, Enter pasa al pago.
 */
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Stack, Text } from "@/components/maquetacion/primitivas";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-cliente";
import { formatMoney } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { PublicProduct } from "@/servicios/productos";

export function ProductSearch({
  onPick,
  onEmptyEnter,
  inputRef,
}: {
  onPick: (product: PublicProduct) => void;
  onEmptyEnter: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProduct[]>([]);
  const [highlight, setHighlight] = useState(0);
  const latest = useRef(0);

  // Búsqueda en vivo contra GET /api/productos, con una pequeña espera entre teclas.
  useEffect(() => {
    const text = query.trim();
    if (!text) return;
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      const result = await apiFetch<{ data: PublicProduct[] }>(
        `/api/productos?q=${encodeURIComponent(text)}&pageSize=8`,
      );
      // Si mientras tanto se escribió otra cosa, esta respuesta ya no sirve.
      if (ticket !== latest.current || !result.ok) return;
      setResults(result.data.data);
      setHighlight(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const visible = query.trim() ? results : [];

  function pick(product: PublicProduct) {
    onPick(product);
    setQuery("");
    setResults([]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, visible.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (!query.trim()) return onEmptyEnter();
      // Si el texto es exactamente un código, se agrega ese; si no, el resaltado.
      const exact = visible.find((p) => p.codigo === query.trim().toUpperCase());
      const chosen = exact ?? visible[highlight];
      if (chosen) pick(chosen);
    } else if (event.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <Stack gap={2} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Código o descripción del producto"
          aria-label="Buscar producto"
          className="h-11 pl-9 text-base"
        />
      </div>
      {visible.length > 0 && (
        <Stack gap={0} role="listbox" aria-label="Resultados" className="absolute top-12 z-20 w-full rounded-lg border bg-popover shadow-lg">
          {visible.map((p, index) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={index === highlight}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => pick(p)}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                index === highlight && "bg-accent",
              )}
            >
              <Stack gap={0}>
                <Text as="span" variant="strong">
                  {p.descripcion}
                </Text>
                <Text as="span" variant="small">
                  {p.codigo} · disponible: {p.existencia}
                </Text>
              </Stack>
              <Text as="span" variant="number">
                {formatMoney(p.precio)}
              </Text>
            </button>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
