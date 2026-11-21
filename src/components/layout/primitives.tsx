/**
 * Primitivas de layout (§10.6): las páginas usan esto en vez de etiquetas HTML sueltas,
 * así los espacios y la tipografía se deciden una vez y se ven iguales en todos lados.
 */
import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/utils";

const gaps = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
} as const;

type Gap = keyof typeof gaps;
type BoxProps = ComponentProps<"div"> & { gap?: Gap };

/** Apila los hijos uno abajo del otro. */
export function Stack({ gap = 4, className, ...props }: BoxProps) {
  return <div className={cn("flex flex-col", gaps[gap], className)} {...props} />;
}

/** Pone los hijos uno al lado del otro; en pantallas chicas pasan a la línea siguiente. */
export function Row({
  gap = 2,
  align = "center",
  justify = "start",
  className,
  ...props
}: BoxProps & {
  align?: "start" | "center" | "end";
  justify?: "start" | "between" | "end";
}) {
  const alignClass = { start: "items-start", center: "items-center", end: "items-end" }[align];
  const justifyClass = { start: "justify-start", between: "justify-between", end: "justify-end" }[
    justify
  ];
  return (
    <div
      className={cn("flex flex-wrap", gaps[gap], alignClass, justifyClass, className)}
      {...props}
    />
  );
}

/** Grilla adaptable: una columna en el celular, más desde el tamaño `sm`. */
export function Grid({ cols = 2, gap = 4, className, ...props }: BoxProps & { cols?: 2 | 3 | 4 }) {
  const colsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  }[cols];
  return <div className={cn("grid grid-cols-1", colsClass, gaps[gap], className)} {...props} />;
}

const textVariants = {
  body: "text-sm",
  muted: "text-sm text-muted-foreground",
  small: "text-xs text-muted-foreground",
  strong: "text-sm font-semibold",
  number: "font-mono text-sm tabular-nums",
  error: "text-sm text-destructive",
} as const;

/** Cualquier texto. `as` cambia la etiqueta (p por defecto). */
export function Text({
  variant = "body",
  as: Tag = "p",
  className,
  ...props
}: ComponentProps<"p"> & { variant?: keyof typeof textVariants; as?: ElementType }) {
  return <Tag className={cn(textVariants[variant], className)} {...props} />;
}

/** Títulos de sección: el nivel 1 es el título de la página. */
export function Title({
  level = 2,
  className,
  ...props
}: ComponentProps<"h2"> & { level?: 1 | 2 | 3 }) {
  const Tag = `h${level}` as const;
  const sizeClass = {
    1: "text-2xl font-bold sm:text-3xl",
    2: "text-lg font-semibold",
    3: "text-base font-semibold",
  }[level];
  return (
    <Tag className={cn("font-heading tracking-tight text-foreground", sizeClass, className)} {...props} />
  );
}
