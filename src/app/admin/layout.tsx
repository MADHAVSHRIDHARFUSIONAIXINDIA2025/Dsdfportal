import { AdminShell } from "@/components/layout/AdminShell";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || user.role !== "admin") redirect("/login");
  return <AdminShell user={user}>{children}</AdminShell>;
}
