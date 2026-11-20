import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Row, Text } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";

/**
 * Previous / next page. The page lives in the URL (?page=2, §10.6), so a
 * list can be reloaded or shared and still show the same page.
 */
export function Paginator({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** The current filters, so changing page keeps them. */
  searchParams: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) if (value) params.set(key, value);
    params.set("page", String(target));
    return `?${params.toString()}`;
  };

  return (
    <Row justify="between">
      <Text variant="muted">
        {total} {total === 1 ? "resultado" : "resultados"} · página {page} de {pages}
      </Text>
      <Row gap={2}>
        <Button variant="outline" size="sm" asChild>
          <Link
            href={hrefFor(page - 1)}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
          >
            <ChevronLeft /> Anterior
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link
            href={hrefFor(page + 1)}
            aria-disabled={page >= pages}
            className={page >= pages ? "pointer-events-none opacity-50" : ""}
          >
            Siguiente <ChevronRight />
          </Link>
        </Button>
      </Row>
    </Row>
  );
}
