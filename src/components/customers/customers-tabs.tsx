import { SectionTabs } from "@/components/common/section-tabs";

/** Las pestañas del módulo Clientes (§4). */
export function CustomersTabs() {
  return (
    <SectionTabs
      tabs={[
        { href: "/clientes", label: "Listado" },
        { href: "/clientes/saldos", label: "Saldos" },
      ]}
    />
  );
}
