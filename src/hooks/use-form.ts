"use client";

/**
 * The common form hook (§10.6). It handles, for every form of the app:
 *  - the values of the fields,
 *  - the error next to each field: first Zod's (before sending), then the server's,
 *  - the "sending..." state,
 *  - the toast with the result.
 *
 * The SAME Zod schema the service uses runs here first (§10.8 point 6).
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

  /** Changes one field and clears its error. */
  function setField<K extends keyof V>(key: K, value: V[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  /** Validates with Zod, calls the server action and shows the result. Returns true on success. */
  async function submit<T>(
    serverAction: (values: V) => Promise<ActionResult<T>>,
    options: { success?: string; onSuccess?: (data: T) => void } = {},
  ): Promise<boolean> {
    // 1) Same rules as the server, before sending anything.
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(toErrorMap(zodToFieldErrors(parsed.error)));
      return false;
    }

    setPending(true);
    try {
      // 2) The server validates AGAIN; its field errors also go next to each field.
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
