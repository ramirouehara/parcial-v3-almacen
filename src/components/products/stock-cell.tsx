import { Row, Text } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/badge";

/** La existencia con la marca «Bajo mínimo» (RF-P1), igual en el catálogo y en la ficha. */
export function StockCell({ existencia, bajoMinimo }: { existencia: number; bajoMinimo: boolean }) {
  return (
    <Row gap={2} justify="end" className="flex-nowrap">
      <Text variant="number">{existencia}</Text>
      {bajoMinimo && <Badge className="bg-tag text-tag-foreground">Bajo mínimo</Badge>}
    </Row>
  );
}
