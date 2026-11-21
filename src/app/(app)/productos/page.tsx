import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { Paginator } from "@/components/comunes/paginador";
import { SearchBox } from "@/components/comunes/buscador";
import { EmptyState } from "@/components/comunes/estados";
import { ActiveBadge } from "@/components/comunes/etiqueta-estado";
import { UrlSelect } from "@/components/comunes/filtro-url";
import { Row, Stack, Text } from "@/components/maquetacion/primitivas";
import { ProductActions } from "@/components/productos/acciones-producto";
import { ProductFormDialog } from "@/components/productos/dialogo-producto";
import { ProductsTabs } from "@/components/productos/pestanas-productos";
import { StockCell } from "@/components/productos/celda-stock";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/formato";
import { requirePageUser } from "@/lib/sesion";
import { listarCategorias } from "@/servicios/categorias";
import { listarProductos } from "@/servicios/productos";

export const metadata: Metadata = { title: "Productos" };

/**
 * /productos: el catálogo (RF-P1). Ambos roles lo ven; solo el admin carga y edita.
 * Búsqueda, categoría, bajo mínimo, estado y página viven en la URL (§10.6).
 */
export default async function ProductsPage({ searchParams }: PageProps<"/productos">) {
  const user = await requirePageUser();
  const isAdmin = user.rol === "admin";
  const params = (await searchParams) as Record<string, string | undefined>;
  // El filtro de estado es solo para el admin; para el vendedor siempre son los activos.
  const query = { ...params, activo: isAdmin ? (params.activo ?? "true") : "true" };

  const [result, categories] = await Promise.all([listarProductos(user, query), listarCategorias(user)]);

  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo, precios y existencias."
        actions={
          isAdmin && (
            <ProductFormDialog
              categories={categories}
              trigger={
                <Button>
                  <Plus /> Nuevo producto
                </Button>
              }
            />
          )
        }
      />
      <ProductsTabs />

      <Row gap={2}>
        <SearchBox placeholder="Buscar por código o descripción" />
        <UrlSelect
          param="categoriaId"
          label="Categoría"
          options={categories.map((c) => ({ value: String(c.id), label: c.nombre }))}
        />
        <UrlSelect param="bajoMinimo" label="Stock" options={[{ value: "true", label: "Bajo mínimo" }]} />
        {isAdmin && (
          <UrlSelect
            param="activo"
            label="Estado"
            allLabel="Estado: activos"
            options={[
              { value: "false", label: "Dados de baja" },
              { value: "todos", label: "Activos y de baja" },
            ]}
          />
        )}
      </Row>

      {result.data.length === 0 ? (
        <EmptyState title="No hay productos con ese filtro" description="Probá con otra búsqueda o categoría." />
      ) : (
        <Stack gap={3}>
          <Stack gap={0} className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Precio</TableHead>
                  <TableHead className="text-right">Existencia</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Text variant="number">{p.codigo}</Text>
                    </TableCell>
                    <TableCell>
                      <Link href={`/productos/${p.id}`} className="hover:underline">
                        <Text as="span" variant="strong">
                          {p.descripcion}
                        </Text>
                      </Link>
                      <Row gap={2}>
                        <Text variant="small" className="sm:hidden">
                          {p.codigo} · {formatMoney(p.precio)}
                        </Text>
                        {!p.activo && <ActiveBadge active={false} />}
                      </Row>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Text variant="muted">{p.categoria.nombre}</Text>
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      <Text variant="number">{formatMoney(p.precio)}</Text>
                    </TableCell>
                    <TableCell>
                      <StockCell existencia={p.existencia} bajoMinimo={p.bajoMinimo} />
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <ProductActions product={p} categories={categories} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
          <Paginator page={result.page} pageSize={result.pageSize} total={result.total} searchParams={params} />
        </Stack>
      )}
    </>
  );
}
