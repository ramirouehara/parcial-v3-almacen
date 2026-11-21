import type { ReactNode } from "react";
import { Row, Stack, Text, Title } from "@/components/layout/primitives";

/** El bloque del título arriba de cada pantalla, con botones opcionales a la derecha. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Row justify="between" align="end" gap={4}>
      <Stack gap={1}>
        <Title level={1}>{title}</Title>
        {description && <Text variant="muted">{description}</Text>}
      </Stack>
      {actions && <Row gap={2}>{actions}</Row>}
    </Row>
  );
}
