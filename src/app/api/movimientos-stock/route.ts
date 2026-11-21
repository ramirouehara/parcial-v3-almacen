// GET /api/movimientos-stock (RF-P6): todos los movimientos, con filtros productoId, tipo, desde y hasta.
import { route } from "@/lib/api";
import { listarMovimientos } from "@/servicios/stock";

export const GET = route(async ({ user, query }) => listarMovimientos(user, query));
