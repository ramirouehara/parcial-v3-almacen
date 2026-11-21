import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Paginator } from "@/components/common/paginator";
import { EmptyState } from "@/components/common/states";
import { ActiveBadge } from "@/components/common/status-badge";
import { Grid, Row, Stack, Text, Title } from "@/components/layout/primitives";
import { MovementsTable } from "@/components/products/movements-table";
import { ProductActions } from "@/components/products/product-actions";
import { StockCell } from "@/components/products/stock-cell";
import { StockMovementDialog } from "@/components/products/stock-movement-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { requirePageUser } from "@/lib/session";
import { listCategories } from "@/services/categories";
import { getProduct } from "@/services/products";
import { listProductMovements } from "@/services/stock";

export const metadata: Metadata = { title: "Producto" };

/** /productos/[id]: la ficha del producto con sus movimientos (RF-P6) e ingreso/egreso (RF-P4, RF-P5). */
export default async function ProductPage({ params, searchParams }: PageProps<"/productos/[id]">) {
  const user = await requirePageUser();
  const isAdmin = user.rol === "admin";
  const { id } = await params;
  const query = (await searchParams) as Record<string, string | undefined>;

  // Si el producto no existe, getProduct lanza 404 y lo muestra error.tsx.
  const product = await getProduct(user, id);
  const [movements, categories] = await Promise.all([
    listProductMovements(user, id, query),
    isAdmin ? listCategories(user) : Promise.resolve([]),
  ]);

  return (
    <>
      <Link href="/productos" className="text-sm text-muted-foreground hover:text-foreground">
        <Row gap={1}>
          <ArrowLeft className="size-4" /> Volver al catálogo
        </Row>
      </Link>
      <PageHeader
        title={product.descripcion}
        description={`${product.codigo} · ${product.categoria.nombre}`}
        actions={
          isAdmin && (
            <>
              <StockMovementDialog
                product={product}
                tipo="ingreso"
                trigger={
                  <Button variant="outline">
                    <Plus /> Ingreso
                  </Button>
                }
              />
              <StockMovementDialog
                product={product}
                tipo="egreso"
                trigger={
                  <Button variant="outline">
                    <Minus /> Egreso
                  </Button>
                }
              />
              <ProductActions product={product} categories={categories} />
            </>
          )
        }
      />

      <Grid cols={4}>
        <Card>
          <CardContent>
            <Text variant="small">Precio de venta</Text>
            <Text variant="number" className="text-xl">
              {formatMoney(product.precio)}
            </Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Text variant="small">Existencia</Text>
            <Row>
              <StockCell existencia={product.existencia} bajoMinimo={product.bajoMinimo} />
            </Row>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Text variant="small">Stock mínimo</Text>
            <Text variant="number" className="text-xl">
              {product.stockMinimo}
            </Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Text variant="small">Estado</Text>
            <ActiveBadge active={product.activo} />
          </CardContent>
        </Card>
      </Grid>

      <Stack gap={3}>
        <Title level={2}>Movimientos de stock</Title>
        {movements.data.length === 0 ? (
          <EmptyState title="Todavía no tiene movimientos" description="Cargá un ingreso para empezar." />
        ) : (
          <>
            <Stack gap={0} className="rounded-lg border bg-card">
              <MovementsTable movements={movements.data} />
            </Stack>
            <Paginator page={movements.page} pageSize={movements.pageSize} total={movements.total} searchParams={query} />
          </>
        )}
      </Stack>
    </>
  );
}
