import { SectionTabs } from "@/components/common/section-tabs";

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
