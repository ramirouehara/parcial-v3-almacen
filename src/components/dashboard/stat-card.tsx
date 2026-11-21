import type { ReactNode } from "react";
import { Stack, Text } from "@/components/layout/primitives";
import { Card, CardContent } from "@/components/ui/card";

/** Un indicador del tablero (RF-T1): título, número grande y un detalle abajo. */
export function StatCard({ label, value, detail, icon }: { label: string; value: string; detail?: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Stack gap={1}>
          <Text variant="muted" className="flex items-center gap-2">
            {icon}
            {label}
          </Text>
          <Text variant="number" className="text-2xl font-semibold">
            {value}
          </Text>
          {detail && <Text variant="small">{detail}</Text>}
        </Stack>
      </CardContent>
    </Card>
  );
}
