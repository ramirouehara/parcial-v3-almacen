// GET /api/movimientos-stock (RF-P6): todos los movimientos, con filtros productoId, tipo, desde y hasta.
import { route } from "@/lib/api";
import { listMovements } from "@/services/stock";

export const GET = route(async ({ user, query }) => listMovements(user, query));
