import type { ReactNode } from "react";
import { Stack, Text } from "@/components/layout/primitives";
import { Label } from "@/components/ui/label";

/** A label, the input and its error message right below (§8 Validación en ambos lados). */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={1}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <Text variant="error" role="alert">
          {error}
        </Text>
      ) : (
        hint && <Text variant="small">{hint}</Text>
      )}
    </Stack>
  );
}
