"use client";

/**
 * El marco que comparten todas las pantallas (§4): panel lateral fijo a la izquierda y una
 * barra superior con el usuario y el botón Salir. En pantallas chicas (< 768 px) el
 * panel se colapsa en un menú que se abre desde la izquierda (§8 Adaptable).
 *
 * Es un Client Component porque necesita la URL actual (usePathname) para
 * resaltar el módulo activo, y estado para abrir el menú del celular.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogOut, Menu } from "lucide-react";
import { salirAccion } from "@/acciones/autenticacion";
import { RoleBadge } from "@/components/comunes/etiqueta-estado";
import { Logo } from "@/components/comunes/logo";
import { Row, Stack, Text } from "@/components/maquetacion/primitivas";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/servicios/permisos";
import { navItems } from "./menu";

function Brand() {
  return (
    <Row gap={3} className="flex-nowrap">
      <Logo size={52} className="ring-2 ring-sidebar-primary/60" />
      <Stack gap={0}>
        <Text variant="small" className="tracking-widest text-sidebar-primary uppercase">
          Almacén
        </Text>
        <Text className="font-heading text-xl font-bold text-white">Rey Dani</Text>
      </Stack>
    </Row>
  );
}

function NavLinks({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label="Módulos" className="flex flex-col gap-1">
      {navItems
        .filter((item) => !item.adminOnly || user.rol === "admin")
        .map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
    </nav>
  );
}

function Sidebar({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  return (
    <Stack gap={0} className="h-full bg-sidebar">
      <Stack gap={0} className="aguayo-stripe" />
      <Stack gap={8} className="px-4 py-6">
        <Brand />
        <NavLinks user={user} onNavigate={onNavigate} />
      </Stack>
    </Stack>
  );
}

export function AppShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Stack gap={0} className="min-h-screen md:pl-60 print:pl-0">
      {/* Panel lateral fijo, solo en pantallas medianas o más grandes */}
      <Stack gap={0} className="no-print fixed inset-y-0 left-0 hidden w-60 md:flex">
        <Sidebar user={user} />
      </Stack>

      {/* Barra superior */}
      <Row
        justify="between"
        className="no-print sticky top-0 z-10 h-14 flex-nowrap border-b bg-background/95 px-4 backdrop-blur"
      >
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-none p-0">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <Sidebar user={user} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <Row gap={3} className="ml-auto flex-nowrap">
          <Link href="/perfil" className="text-right hover:underline">
            <Text variant="strong" as="span" className="block leading-tight">
              {user.nombre}
            </Text>
          </Link>
          <RoleBadge rol={user.rol} />
          <form action={salirAccion}>
            <Button type="submit" variant="ghost" size="sm" aria-label="Salir">
              <LogOut />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </Row>
      </Row>

      <Stack gap={6} className="w-full max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </Stack>
    </Stack>
  );
}
