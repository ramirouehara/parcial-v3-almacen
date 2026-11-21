"use client";

/**
 * Campo de importe (§10.6). La persona escribe en formato argentino ("12.345,50")
 * y el formulario recibe CENTAVOS enteros (regla 10): 1234550.
 * Si escribe algo inválido, entrega NaN y el esquema Zod muestra el error.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoney } from "@/lib/formato";

const toText = (cents: number | null) => (cents === null || Number.isNaN(cents) ? "" : formatMoneyInput(cents));

export function MoneyInput({
  id,
  value,
  onChange,
  invalid,
  ...props
}: {
  id: string;
  value: number | null;
  onChange: (cents: number | null) => void;
  invalid?: boolean;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "id">) {
  const [text, setText] = useState(() => toText(value));
  const [previous, setPrevious] = useState(value);

  // Si el valor cambia desde afuera (por ejemplo, se limpia el formulario), se actualiza el texto.
  // Object.is porque NaN === NaN es false, pero Object.is(NaN, NaN) es true.
  if (!Object.is(previous, value)) {
    setPrevious(value);
    if (!Object.is(parseMoney(text), value)) setText(toText(value));
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        className="pl-7 font-mono tabular-nums"
        value={text}
        aria-invalid={invalid}
        onChange={(e) => {
          setText(e.target.value);
          const cents = parseMoney(e.target.value);
          setPrevious(cents);
          onChange(cents);
        }}
        {...props}
      />
    </div>
  );
}
