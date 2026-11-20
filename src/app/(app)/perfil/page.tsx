import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/common/page-header";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mi perfil" };

// /perfil (RF-U5): every user changes their own password.
export default async function ProfilePage() {
  const user = await requirePageUser();
  return (
    <>
      <PageHeader title="Mi perfil" description={`${user.nombre} · ${user.email}`} />
      <ChangePasswordForm />
    </>
  );
}
