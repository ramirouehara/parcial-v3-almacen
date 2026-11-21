"use client";

/**
 * Nueva venta (RF-V1 a RF-V6): una sola pantalla con comprador, ítems y forma de pago.
 * El total se recalcula en cada cambio. Se opera con teclado (§8 Venta ágil):
 *   buscar → Enter agrega → Enter con el buscador vacío pasa al pago → Enter confirma.
 *
 * Esta pantalla solo ADELANTA los controles para que la venta sea cómoda. El que decide
 * es el servidor (POST /api/facturas): vuelve a verificar stock, precios, límite y monto.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { FormField } from "@/components/common/form-field";
import { MoneyInput } from "@/components/common/money-input";
import { Grid, Row, Stack, Text, Title } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { formatMoney } from "@/lib/format";
import { formaPagoLabels } from "@/lib/labels";
import { zodToFieldErrors } from "@/lib/validation";
import { createInvoiceSchema, tarjetaMarcas, type CreateInvoiceInput } from "@/schemas/invoices";
import type { PublicCustomer } from "@/services/customers";
import type { PublicInvoice } from "@/services/invoices";
import type { PublicProduct } from "@/services/products";
import { CustomerPicker } from "./customer-picker";
import { ProductSearch } from "./product-search";

type Line = { productoId: number; codigo: string; descripcion: string; precio: number; existencia: number; cantidad: number };
type Forma = "contado" | "tarjeta" | "cuenta_corriente";

export function SaleForm() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const paymentRef = useRef<HTMLInputElement>(null);

  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [forma, setForma] = useState<Forma>("contado");
  const [montoRecibido, setMontoRecibido] = useState<number | null>(null);
  const [tarjeta, setTarjeta] = useState({ tipo: "debito" as "debito" | "credito", marca: "Visa", ultimos4: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [nextNumber, setNextNumber] = useState("");

  // Número informativo: el real se asigna recién al confirmar (regla 4).
  useEffect(() => {
    apiFetch<{ numeroFormateado: string }>("/api/facturas/proximo-numero").then((r) => {
      if (r.ok) setNextNumber(r.data.numeroFormateado);
    });
  }, []);

  const total = lines.reduce((sum, l) => sum + l.precio * l.cantidad, 0);
  const vuelto = montoRecibido !== null && !Number.isNaN(montoRecibido) ? montoRecibido - total : null;
  const canUseAccount = customer?.cuentaCorriente === true;
  const overLimit =
    forma === "cuenta_corriente" && customer?.disponible !== null && customer?.disponible !== undefined && total > customer.disponible;

  /** RF-V3 y RF-V4: agregar un producto que ya está suma 1 al renglón, sin pasar la existencia. */
  function addProduct(p: PublicProduct) {
    const current = lines.find((l) => l.productoId === p.id);
    const wanted = (current?.cantidad ?? 0) + 1;
    if (wanted > p.existencia) {
      toast.error(p.existencia === 0 ? `${p.descripcion}: sin stock.` : `${p.descripcion}: solo hay ${p.existencia}.`);
      return;
    }
    setLines(
      current
        ? lines.map((l) => (l.productoId === p.id ? { ...l, cantidad: wanted, existencia: p.existencia } : l))
        : [...lines, { productoId: p.id, codigo: p.codigo, descripcion: p.descripcion, precio: p.precio, existencia: p.existencia, cantidad: 1 }],
    );
    setErrors({});
  }

  function changeQuantity(productoId: number, cantidad: number) {
    setLines(lines.map((l) => (l.productoId === productoId ? { ...l, cantidad } : l)));
  }

  function removeLine(productoId: number) {
    setLines(lines.filter((l) => l.productoId !== productoId));
    searchRef.current?.focus();
  }

  function goToPayment() {
    if (lines.length === 0) return toast.error("Agregá al menos un producto.");
    paymentRef.current?.focus();
  }

  /** El cuerpo de POST /api/facturas: productos y cantidades, nunca precios (§11.1). */
  function buildBody(): CreateInvoiceInput {
    const pago =
      forma === "contado"
        ? { forma, ...(montoRecibido !== null ? { montoRecibido } : {}) }
        : forma === "tarjeta"
          ? { forma, tarjeta }
          : { forma };
    return {
      clienteId: customer?.id ?? null,
      items: lines.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      pago,
    };
  }

  async function confirm(event?: React.FormEvent) {
    event?.preventDefault();
    if (pending) return;
    const body = buildBody();

    // 1) El MISMO esquema Zod que usa el servidor, antes de mandar nada (§10.8 punto 6).
    const parsed = createInvoiceSchema.safeParse(body);
    const localErrors: Record<string, string> = {};
    if (!parsed.success) for (const e of zodToFieldErrors(parsed.error)) localErrors[e.campo] = e.mensaje;
    lines.forEach((l, i) => {
      if (l.cantidad > l.existencia) localErrors[`items.${i}.cantidad`] = `Solo hay ${l.existencia}.`;
    });
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      toast.error(localErrors.items ?? "Revisá los datos de la venta.");
      return;
    }

    // 2) El servidor vuelve a verificar todo y graba la factura en una transacción.
    setPending(true);
    const result = await apiFetch<PublicInvoice>("/api/facturas", { method: "POST", body });
    if (!result.ok) {
      setPending(false); // solo si falló: si salió bien, el botón sigue bloqueado hasta cambiar de pantalla
      toast.error(result.error.message);
      // Si otro vendedor se llevó stock en el medio, se actualiza lo disponible de cada renglón.
      if (result.error.code === "STOCK_INSUFICIENTE" && Array.isArray(result.error.details)) {
        const available = new Map(
          (result.error.details as { productoId: number; disponible: number }[]).map((d) => [d.productoId, d.disponible]),
        );
        setLines(lines.map((l) => (available.has(l.productoId) ? { ...l, existencia: available.get(l.productoId)! } : l)));
      }
      if (Array.isArray(result.error.details)) {
        const fieldErrors: Record<string, string> = {};
        for (const d of result.error.details as { campo?: string; mensaje?: string }[]) {
          if (d.campo && d.mensaje) fieldErrors[d.campo] = d.mensaje;
        }
        setErrors(fieldErrors);
      }
      return;
    }
    // Sin setPending(false): un segundo Enter mientras se cambia de pantalla no emite otra factura igual.
    toast.success(`Factura ${result.data.numeroFormateado} emitida.`);
    router.push(`/ventas/${result.data.id}`);
  }

  return (
    <form onSubmit={confirm} noValidate>
      <Grid cols={2} className="items-start sm:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Stack gap={4}>
          {/* overflow-visible: las listas de resultados se despliegan por encima de lo que sigue. */}
          <Card className="relative z-20 overflow-visible">
            <CardContent>
              <Stack gap={3}>
                <Title level={3}>Comprador</Title>
                <CustomerPicker
                  customer={customer}
                  onChange={(c) => {
                    setCustomer(c);
                    if (!c?.cuentaCorriente && forma === "cuenta_corriente") setForma("contado");
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card className="relative z-10 overflow-visible">
            <CardContent>
              <Stack gap={3}>
                <Row justify="between">
                  <Title level={3}>Productos</Title>
                  <Text variant="small">Enter agrega · Enter con el buscador vacío pasa al pago</Text>
                </Row>
                <ProductSearch inputRef={searchRef} onPick={addProduct} onEmptyEnter={goToPayment} />
                {errors.items && <Text variant="error">{errors.items}</Text>}
                {lines.length === 0 ? (
                  <Text variant="muted" className="py-6 text-center">
                    Todavía no agregaste productos.
                  </Text>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-28">Cantidad</TableHead>
                        <TableHead className="hidden text-right sm:table-cell">Precio</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((l, i) => (
                        <TableRow key={l.productoId}>
                          <TableCell>
                            <Text variant="strong">{l.descripcion}</Text>
                            <Text variant="small">
                              {l.codigo} · disponible: {l.existencia}
                            </Text>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={l.existencia}
                              aria-label={`Cantidad de ${l.descripcion}`}
                              aria-invalid={!!errors[`items.${i}.cantidad`] || l.cantidad > l.existencia}
                              value={Number.isNaN(l.cantidad) ? "" : l.cantidad}
                              onChange={(e) => changeQuantity(l.productoId, e.target.value === "" ? Number.NaN : Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  searchRef.current?.focus();
                                }
                              }}
                            />
                            {(errors[`items.${i}.cantidad`] || l.cantidad > l.existencia) && (
                              <Text variant="error" className="text-xs">
                                {l.cantidad > l.existencia ? `Solo hay ${l.existencia}.` : errors[`items.${i}.cantidad`]}
                              </Text>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-right sm:table-cell">
                            <Text variant="number">{formatMoney(l.precio)}</Text>
                          </TableCell>
                          <TableCell className="text-right">
                            <Text variant="number">{formatMoney(Number.isNaN(l.cantidad) ? 0 : l.precio * l.cantidad)}</Text>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Quitar ${l.descripcion}`}
                              onClick={() => removeLine(l.productoId)}
                            >
                              <Trash2 />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Card className="xl:sticky xl:top-20">
          <CardContent>
            <Stack gap={4}>
              <Row justify="between">
                <Title level={3}>Pago</Title>
                {nextNumber && <Text variant="small">Factura {nextNumber}</Text>}
              </Row>
              <Stack gap={0}>
                <Text variant="small">Total</Text>
                <Text variant="number" className="text-3xl font-semibold">
                  {formatMoney(Number.isNaN(total) ? 0 : total)}
                </Text>
              </Stack>

              <Tabs value={forma} onValueChange={(v) => setForma(v as Forma)}>
                <TabsList className="w-full">
                  <TabsTrigger value="contado">{formaPagoLabels.contado}</TabsTrigger>
                  <TabsTrigger value="tarjeta">{formaPagoLabels.tarjeta}</TabsTrigger>
                  <TabsTrigger value="cuenta_corriente" disabled={!canUseAccount}>
                    Cta. cte.
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {forma === "contado" && (
                <Stack gap={2}>
                  <FormField
                    label="Monto recibido"
                    htmlFor="montoRecibido"
                    error={errors["pago.montoRecibido"]}
                    hint="Vacío = paga justo."
                  >
                    <MoneyInput
                      id="montoRecibido"
                      ref={paymentRef}
                      value={montoRecibido}
                      onChange={(cents) => setMontoRecibido(cents)}
                      invalid={!!errors["pago.montoRecibido"] || (vuelto !== null && vuelto < 0)}
                    />
                  </FormField>
                  {vuelto !== null && (
                    <Row justify="between">
                      <Text variant="muted">{vuelto < 0 ? "Falta" : "Vuelto"}</Text>
                      <Text variant="number" className={vuelto < 0 ? "text-destructive" : "text-lg"}>
                        {formatMoney(Math.abs(vuelto))}
                      </Text>
                    </Row>
                  )}
                </Stack>
              )}

              {forma === "tarjeta" && (
                <Stack gap={3}>
                  <Grid cols={2}>
                    <FormField label="Tipo" htmlFor="tarjetaTipo">
                      <Select value={tarjeta.tipo} onValueChange={(v) => setTarjeta({ ...tarjeta, tipo: v as "debito" | "credito" })}>
                        <SelectTrigger id="tarjetaTipo" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debito">Débito</SelectItem>
                          <SelectItem value="credito">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Marca" htmlFor="tarjetaMarca" error={errors["pago.tarjeta.marca"]}>
                      <Select value={tarjeta.marca} onValueChange={(v) => setTarjeta({ ...tarjeta, marca: v })}>
                        <SelectTrigger id="tarjetaMarca" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tarjetaMarcas.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </Grid>
                  <FormField
                    label="Últimos 4 dígitos"
                    htmlFor="ultimos4"
                    error={errors["pago.tarjeta.ultimos4"]}
                    hint="Nunca se pide el número completo (regla 9)."
                  >
                    <Input
                      id="ultimos4"
                      ref={paymentRef}
                      inputMode="numeric"
                      maxLength={4}
                      className="font-mono"
                      value={tarjeta.ultimos4}
                      onChange={(e) => setTarjeta({ ...tarjeta, ultimos4: e.target.value.replace(/\D/g, "") })}
                      aria-invalid={!!errors["pago.tarjeta.ultimos4"]}
                    />
                  </FormField>
                </Stack>
              )}

              {forma === "cuenta_corriente" && customer && (
                <Stack gap={1}>
                  <Text variant="muted">Se carga en la libreta de {customer.nombre}.</Text>
                  <Text variant="small">
                    Debe {formatMoney(customer.saldo)}
                    {customer.disponible !== null && ` · disponible ${formatMoney(customer.disponible)}`}
                  </Text>
                  {overLimit && <Text variant="error">La venta supera el límite de crédito.</Text>}
                  <input ref={paymentRef} className="sr-only" aria-label="Confirmar con Enter" readOnly />
                </Stack>
              )}

              {!canUseAccount && (
                <Text variant="small">
                  {customer ? "Este cliente no tiene cuenta corriente." : "Cuenta corriente: solo para clientes registrados."}
                </Text>
              )}

              <Button type="submit" size="lg" disabled={pending || lines.length === 0 || overLimit}>
                {pending ? "Confirmando..." : "Confirmar venta"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </form>
  );
}
