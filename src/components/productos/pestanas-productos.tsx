import { SectionTabs } from "@/components/comunes/pestanas";

/** Las pestañas del módulo Productos (§4). */
export function ProductsTabs() {
  return (
    <SectionTabs
      tabs={[
        { href: "/productos", label: "Catálogo" },
        { href: "/productos/existencias", label: "Existencias" },
        { href: "/productos/categorias", label: "Categorías" },
      ]}
    />
  );
}
