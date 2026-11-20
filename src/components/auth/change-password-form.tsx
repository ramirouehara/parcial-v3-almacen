"use client";

import { changePasswordAction } from "@/actions/auth";
import { FormField } from "@/components/common/form-field";
import { Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "@/hooks/use-form";
import { changePasswordSchema } from "@/schemas/auth";

const empty = { actual: "", nueva: "" };

/** RF-U5: current password + new one (at least 8 characters). */
export function ChangePasswordForm() {
  const form = useForm(changePasswordSchema, empty);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await form.submit(changePasswordAction, {
      success: "Contraseña actualizada.",
      onSuccess: () => form.setValues(empty),
    });
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={4}>
            <FormField label="Contraseña actual" htmlFor="actual" error={form.errors.actual}>
              <Input
                id="actual"
                type="password"
                autoComplete="current-password"
                value={form.values.actual}
                onChange={(e) => form.setField("actual", e.target.value)}
                aria-invalid={!!form.errors.actual}
              />
            </FormField>
            <FormField
              label="Contraseña nueva"
              htmlFor="nueva"
              error={form.errors.nueva}
              hint="Al menos 8 caracteres."
            >
              <Input
                id="nueva"
                type="password"
                autoComplete="new-password"
                value={form.values.nueva}
                onChange={(e) => form.setField("nueva", e.target.value)}
                aria-invalid={!!form.errors.nueva}
              />
            </FormField>
            <Button type="submit" disabled={form.pending} className="self-start">
              {form.pending ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
