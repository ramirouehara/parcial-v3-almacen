import { House, Package, ShoppingCart, UserCog, Users } from "lucide-react";

/** The five modules of the sidebar (§4). `adminOnly` hides the link for sellers. */
export const navItems = [
  { href: "/", label: "Inicio", icon: House, adminOnly: false },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart, adminOnly: false },
  { href: "/productos", label: "Productos", icon: Package, adminOnly: false },
  { href: "/clientes", label: "Clientes", icon: Users, adminOnly: false },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, adminOnly: true },
];
