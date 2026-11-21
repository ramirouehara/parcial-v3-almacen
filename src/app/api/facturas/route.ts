// GET /api/facturas (RF-V8) y POST /api/facturas (RF-V1 a RF-V6). Ambos roles.
import { route } from "@/lib/api";
import { createInvoice, listInvoices } from "@/services/invoices";

export const GET = route(async ({ user, query }) => listInvoices(user, query));

export const POST = route(async ({ user, body }) => createInvoice(user, await body()), { status: 201 });
