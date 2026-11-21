import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/autenticacion/form-cambiar-contrasena";
import { PageHeader } from "@/components/comunes/encabezado-pagina";
import { requirePageUser } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mi perfil" };

// /perfil (RF-U5): cada usuario cambia su propia contraseña.
export default async function ProfilePage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader title="Mi perfil" description={`${user.nombre} · ${user.email}`} />
      <ChangePasswordForm />
    </>
  );
}
