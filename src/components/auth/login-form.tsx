"use client";

import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { FormField } from "@/components/common/form-field";
import { Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "@/hooks/use-form";
import { loginSchema } from "@/schemas/auth";

/** RF-U1: email + contraseña. El mismo loginSchema valida acá y en el servidor. */
export function LoginForm() {
  const router = useRouter();
  const form = useForm(loginSchema, { email: "", password: "" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await form.submit(loginAction, {
      onSuccess: () => {
        router.replace("/");
        router.refresh();
      },
    });
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={4}>
            <FormField label="Email" htmlFor="email" error={form.errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                value={form.values.email}
                onChange={(e) => form.setField("email", e.target.value)}
                aria-invalid={!!form.errors.email}
              />
            </FormField>
            <FormField label="Contraseña" htmlFor="password" error={form.errors.password}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.values.password}
                onChange={(e) => form.setField("password", e.target.value)}
                aria-invalid={!!form.errors.password}
              />
            </FormField>
            <Button type="submit" disabled={form.pending} className="w-full">
              {form.pending ? "Ingresando..." : "Ingresar"}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
