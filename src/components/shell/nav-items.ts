import { House, Package, ShoppingCart, UserCog, Users } from "lucide-react";

/** Los cinco módulos del panel lateral (§4). `adminOnly` oculta el enlace a los vendedores. */
export const navItems = [
  { href: "/", label: "Inicio", icon: House, adminOnly: false },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart, adminOnly: false },
  { href: "/productos", label: "Productos", icon: Package, adminOnly: false },
  { href: "/clientes", label: "Clientes", icon: Users, adminOnly: false },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, adminOnly: true },
];
