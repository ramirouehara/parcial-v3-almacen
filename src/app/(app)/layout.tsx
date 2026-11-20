import { AppShell } from "@/components/shell/app-shell";
import { requirePageUser } from "@/lib/session";

/**
 * Layout of every screen INSIDE the system (§4): sidebar + top bar.
 * The "(app)" folder is a route group: the parentheses mean it does not
 * appear in the URL. /usuarios is src/app/(app)/usuarios/page.tsx.
 * /login lives outside this folder, so it does not get the sidebar.
 *
 * Second barrier of §10.5: without a valid user it redirects to /login.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser();
  return <AppShell user={user}>{children}</AppShell>;
}
