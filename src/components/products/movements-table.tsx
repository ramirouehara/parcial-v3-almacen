import Link from "next/link";
import { Text } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { PublicMovement } from "@/services/stock";

const typeLabels = { venta: "Venta", anulacion: "Anulación", ingreso: "Ingreso", egreso: "Egreso" } as const;

/** Tabla de movimientos de stock (RF-P6): fecha, tipo, cantidad, existencia resultante, usuario y factura. */
export function MovementsTable({ movements, showProduct }: { movements: PublicMovement[]; showProduct?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          {showProduct && <TableHead>Producto</TableHead>}
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Queda</TableHead>
          <TableHead className="hidden md:table-cell">Motivo / factura</TableHead>
          <TableHead className="hidden md:table-cell">Usuario</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <Text variant="number">{formatDateTime(m.fecha)}</Text>
            </TableCell>
            {showProduct && (
              <TableCell>
                <Link href={`/productos/${m.producto.id}`} className="hover:underline">
                  <Text as="span" variant="strong">
                    {m.producto.descripcion}
                  </Text>
                </Link>
                <Text variant="small">{m.producto.codigo}</Text>
              </TableCell>
            )}
            <TableCell>
              <Badge variant={m.cantidad < 0 ? "outline" : "secondary"}>{typeLabels[m.tipo]}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Text variant="number" className={m.cantidad < 0 ? "text-destructive" : "text-primary"}>
                {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
              </Text>
            </TableCell>
            <TableCell className="hidden text-right sm:table-cell">
              <Text variant="number">{m.existenciaResultante}</Text>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {m.referencia ? (
                <Link href={`/ventas/${m.referencia.facturaId}`} className="font-mono text-sm hover:underline">
                  {m.referencia.numero}
                </Link>
              ) : (
                <Text>{m.motivo}</Text>
              )}
              {m.observacion && <Text variant="small">{m.observacion}</Text>}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Text variant="muted">{m.usuario.nombre}</Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
