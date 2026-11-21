import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * El logo del almacén (public/logo.webp, 400 × 400 px, con el fondo transparente).
 * `unoptimized`: la imagen ya está achicada, así Next la sirve tal cual.
 */
export function Logo({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.webp"
      alt="El Rey Dani · Almacén de barrio"
      width={size}
      height={size}
      unoptimized
      priority
      className={cn("shrink-0 rounded-full", className)}
    />
  );
}
