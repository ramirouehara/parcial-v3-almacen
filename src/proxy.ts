/**
 * Primera barrera del §10.5. Next.js corre esto ANTES de dibujar cualquier página.
 * Sin una cookie firmada válida, el usuario va a /login.
 *
 * Es solo un control rápido. Las páginas vuelven a buscar al usuario en la base
 * (barrera 2) y los servicios comprueban el rol (barrera 3).
 * La API queda afuera: su envoltorio (src/lib/api.ts) responde 401 en JSON.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/token-sesion";

export async function proxy(request: NextRequest) {
  const userId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!userId && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (userId && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url)); // ya está logueado
  }
  return NextResponse.next();
}

export const config = {
  // Todas las rutas menos la API, los archivos propios de Next y las imágenes
  // (el logo se ve también en /login, sin sesión).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
