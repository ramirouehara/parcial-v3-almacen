import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Paginator } from "@/components/common/paginator";
import { SearchBox } from "@/components/common/search-box";
import { EmptyState, ForbiddenState } from "@/components/common/states";
import { ActiveBadge, RoleBadge } from "@/components/common/status-badge";
import { UrlSelect } from "@/components/common/url-select";
import { Row, Stack, Text } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserActions } from "@/components/users/user-actions";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { requirePageUser } from "@/lib/session";
import { listUsers } from "@/services/users";

export const metadata: Metadata = { title: "Usuarios" };

/**
 * /usuarios (RF-U4), solo admin.
 * Es un Server Component: corre en el servidor, llama al servicio directo y
 * manda HTML ya armado. Búsqueda, filtro y página vienen de la URL (§10.6).
 */
export default async function UsersPage({ searchParams }: PageProps<"/usuarios">) {
  const user = await requirePageUser();
  // Solo ayuda visual: listUsers() igual lanzaría 403 para un vendedor.
  if (user.rol !== "admin") return <ForbiddenState />;

  const params = (await searchParams) as Record<string, string | undefined>;
  const result = await listUsers(user, params);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Quién puede entrar al sistema y con qué rol."
        actions={
          <UserFormDialog
            trigger={
              <Button>
                <Plus /> Nuevo usuario
              </Button>
            }
          />
        }
      />

      <Row gap={2}>
        <SearchBox placeholder="Buscar por nombre o email" />
        <UrlSelect
          param="activo"
          label="Estado"
          options={[
            { value: "true", label: "Activos" },
            { value: "false", label: "Inactivos" },
          ]}
        />
      </Row>

      {result.data.length === 0 ? (
        <EmptyState title="No hay usuarios con ese filtro" description="Probá con otra búsqueda." />
      ) : (
        <Stack gap={3}>
          <Stack gap={0} className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Text variant="strong">{u.nombre}</Text>
                      <Text variant="small" className="sm:hidden">
                        {u.email}
                      </Text>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                    <TableCell>
                      <RoleBadge rol={u.rol} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <ActiveBadge active={u.activo} />
                    </TableCell>
                    <TableCell>
                      <UserActions user={u} />
                    </TableCell>
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
