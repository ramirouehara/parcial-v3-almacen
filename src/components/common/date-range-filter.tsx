"use client";

/** Filtro "desde / hasta" que escribe los días en la URL (?desde=2026-11-01&hasta=2026-11-21), §10.6. */
import { useRouter, useSearchParams } from "next/navigation";
import { Row, Text } from "@/components/layout/primitives";
import { Input } from "@/components/ui/input";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function change(param: "desde" | "hasta", value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(param, value);
    else params.delete(param);
    params.delete("page");
    router.replace(`?${params.toString()}`);
  }

  return (
    <Row gap={2} className="flex-nowrap">
      <Text as="span" variant="muted">
        Desde
      </Text>
      <Input
        type="date"
        aria-label="Desde"
        className="w-40"
        defaultValue={searchParams.get("desde") ?? ""}
        onChange={(e) => change("desde", e.target.value)}
      />
      <Text as="span" variant="muted">
        hasta
      </Text>
      <Input
        type="date"
        aria-label="Hasta"
        className="w-40"
        defaultValue={searchParams.get("hasta") ?? ""}
        onChange={(e) => change("hasta", e.target.value)}
      />
    </Row>
  );
}
