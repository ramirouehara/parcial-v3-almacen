import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/states";
import { ActiveBadge } from "@/components/common/status-badge";
import { Stack, Text } from "@/components/layout/primitives";
import { CategoryActions } from "@/components/products/category-actions";
import { CategoryFormDialog } from "@/components/products/category-form-dialog";
import { ProductsTabs } from "@/components/products/products-tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePageUser } from "@/lib/session";
import { listCategories } from "@/services/categories";

export const metadata: Metadata = { title: "Categorías" };

/** /productos/categorias (RF-P7). Ambos roles la ven; solo el admin crea y edita. */
export default async function CategoriesPage() {
  const user = await requirePageUser();
  const isAdmin = user.rol === "admin";
  const categories = await listCategories(user, { todas: isAdmin ? "true" : "false" });

  return (
    <>
      <PageHeader
        title="Productos"
        description="Las categorías ordenan el catálogo."
        actions={
          isAdmin && (
            <CategoryFormDialog
              trigger={
                <Button>
                  <Plus /> Nueva categoría
                </Button>
              }
            />
          )
        }
      />
      <ProductsTabs />
      {categories.length === 0 ? (
        <EmptyState title="Todavía no hay categorías" description="Creá la primera para cargar productos." />
      ) : (
        <Stack gap={0} className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Productos activos</TableHead>
                <TableHead>Estado</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Text variant="strong">{c.nombre}</Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text variant="number">{c.productosActivos}</Text>
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={c.activa} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <CategoryActions category={c} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      )}
    </>
  );
}
