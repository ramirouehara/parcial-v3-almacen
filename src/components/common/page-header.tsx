import type { ReactNode } from "react";
import { Row, Stack, Text, Title } from "@/components/layout/primitives";

/** The title block at the top of every screen, with optional buttons on the right. */
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
