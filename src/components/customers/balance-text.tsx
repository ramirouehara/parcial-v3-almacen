import { Text } from "@/components/layout/primitives";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** El saldo de un cliente: en rojo si debe, gris si está en cero. */
export function BalanceText({ saldo, className }: { saldo: number; className?: string }) {
  return (
    <Text variant="number" className={cn(saldo > 0 ? "text-destructive" : "text-muted-foreground", className)}>
      {formatMoney(saldo)}
    </Text>
  );
}
