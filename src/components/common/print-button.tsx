"use client";

/** Botón para imprimir el comprobante o el recibo (RF-V7, RF-C5). No sale en el papel. */
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="outline" className="no-print" onClick={() => window.print()}>
      <Printer /> Imprimir
    </Button>
  );
}
