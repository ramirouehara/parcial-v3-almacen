// GET /api/tablero (RF-T1 a RF-T3): indicadores, ventas diarias, formas de pago y más vendidos.
import { route } from "@/lib/api";
import { getDashboard } from "@/servicios/tablero";

export const GET = route(async ({ user }) => getDashboard(user));
