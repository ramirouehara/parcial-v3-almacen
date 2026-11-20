/**
 * Layout primitives (§10.6): pages use these instead of loose HTML tags,
 * so spacing and typography are decided once and look the same everywhere.
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

/** Stacks children vertically. */
export function Stack({ gap = 4, className, ...props }: BoxProps) {
  return <div className={cn("flex flex-col", gaps[gap], className)} {...props} />;
}

/** Puts children side by side; wraps on small screens. */
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

/** Responsive grid: one column on phones, more from the `sm` breakpoint. */
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

/** Any piece of text. `as` changes the tag (p by default). */
export function Text({
  variant = "body",
  as: Tag = "p",
  className,
  ...props
}: ComponentProps<"p"> & { variant?: keyof typeof textVariants; as?: ElementType }) {
  return <Tag className={cn(textVariants[variant], className)} {...props} />;
}

/** Section titles: level 1 is the page title. */
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
