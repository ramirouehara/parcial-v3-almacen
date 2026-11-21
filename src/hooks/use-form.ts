"use client";

/**
 * El hook común de formularios (§10.6). Se encarga, en todos los formularios de la app, de:
 *  - los valores de los campos,
 *  - el error al lado de cada campo: primero el de Zod (antes de enviar), después el del servidor,
 *  - el estado "enviando...",
 *  - el aviso (toast) con el resultado.
 *
 * El MISMO esquema Zod que usa el servicio corre primero acá (§10.8 punto 6).
 */
import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import type { ActionResult } from "@/lib/action";
import type { FieldError } from "@/lib/errors";
import { zodToFieldErrors } from "@/lib/validation";

type Errors = Record<string, string>;

const toErrorMap = (details: FieldError[]): Errors =>
  Object.fromEntries(details.map((d) => [d.campo, d.mensaje]));

const isFieldErrorList = (value: unknown): value is FieldError[] =>
  Array.isArray(value) && value.every((item) => item && typeof item === "object" && "campo" in item);

export function useForm<V extends Record<string, unknown>>(schema: z.ZodType, initialValues: V) {
  const [values, setValues] = useState<V>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  /** Cambia un campo y borra su error. */
  function setField<K extends keyof V>(key: K, value: V[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  /** Valida con Zod, llama a la server action y muestra el resultado. Devuelve true si salió bien. */
  async function submit<T>(
    serverAction: (values: V) => Promise<ActionResult<T>>,
    options: { success?: string; onSuccess?: (data: T) => void } = {},
  ): Promise<boolean> {
    // 1) Las mismas reglas que el servidor, antes de mandar nada.
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(toErrorMap(zodToFieldErrors(parsed.error)));
      return false;
    }

    setPending(true);
    try {
      // 2) El servidor valida OTRA VEZ; sus errores de campo también van al lado de cada campo.
      const result = await serverAction(values);
      if (!result.ok) {
        if (isFieldErrorList(result.error.details)) setErrors(toErrorMap(result.error.details));
        toast.error(result.error.message);
        return false;
      }
      setErrors({});
      if (options.success) toast.success(options.success);
      options.onSuccess?.(result.data);
      return true;
    } catch {
      toast.error("No se pudo conectar con el servidor.");
      return false;
    } finally {
      setPending(false);
    }
  }

  return { values, setValues, setField, errors, pending, submit };
}
