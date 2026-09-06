import { EngineerShell } from "@/components/layout/EngineerShell";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EngineerAppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || user.role !== "engineer") redirect("/ext/login");
  return <EngineerShell user={user}>{children}</EngineerShell>;
}
