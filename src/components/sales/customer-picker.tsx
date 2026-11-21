"use client";

/**
 * El comprador de la venta (RF-V2): por defecto Consumidor final. Se puede buscar un
 * cliente por nombre o documento, o darlo de alta sin perder la venta en curso.
 */
import { useEffect, useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { formatDocument, formatMoney } from "@/lib/format";
import type { PublicCustomer } from "@/services/customers";

export function CustomerPicker({
  customer,
  onChange,
}: {
  customer: PublicCustomer | null;
  onChange: (customer: PublicCustomer | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicCustomer[]>([]);
  const latest = useRef(0);

  useEffect(() => {
    const text = query.trim();
    if (!text) return;
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      const result = await apiFetch<{ data: PublicCustomer[] }>(`/api/clientes?q=${encodeURIComponent(text)}&pageSize=6`);
      if (ticket === latest.current && result.ok) setResults(result.data.data);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function choose(c: PublicCustomer | null) {
    onChange(c);
    setQuery("");
    setResults([]);
  }

  if (customer) {
    return (
      <Row justify="between" className="flex-nowrap rounded-lg border p-3">
        <Stack gap={0}>
          <Text variant="strong">{customer.nombre}</Text>
          <Text variant="small">
            {customer.tipoDoc} {formatDocument(customer.tipoDoc, customer.nroDoc)}
            {customer.cuentaCorriente &&
              ` · debe ${formatMoney(customer.saldo)}${customer.disponible !== null ? ` · disponible ${formatMoney(customer.disponible)}` : ""}`}
          </Text>
        </Stack>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Volver a consumidor final" onClick={() => choose(null)}>
          <X />
        </Button>
      </Row>
    );
  }

  const visible = query.trim() ? results : [];
  return (
    <Stack gap={2} className="relative">
      <Row gap={2} className="flex-nowrap">
        <Badge variant="secondary">Consumidor final</Badge>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (visible[0]) choose(visible[0]);
            }
          }}
          placeholder="Buscar cliente por nombre o documento"
          aria-label="Buscar cliente"
        />
        <CustomerFormDialog
          onSaved={(c) => choose(c)}
          trigger={
            <Button type="button" variant="outline" size="icon" aria-label="Nuevo cliente">
              <UserPlus />
            </Button>
          }
        />
      </Row>
      {visible.length > 0 && (
        <Stack gap={0} className="absolute top-11 z-20 w-full rounded-lg border bg-popover shadow-lg">
          {visible
            .filter((c) => c.activo)
            .map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => choose(c)}
                className="flex justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <Text as="span" variant="strong">
                  {c.nombre}
                </Text>
                <Text as="span" variant="small">
                  {c.tipoDoc} {formatDocument(c.tipoDoc, c.nroDoc)}
                </Text>
              </button>
            ))}
        </Stack>
      )}
    </Stack>
  );
}
