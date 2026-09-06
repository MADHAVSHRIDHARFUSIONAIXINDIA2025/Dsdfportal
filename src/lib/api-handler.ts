import { connectDB } from "@/lib/db";
import { fail } from "@/lib/http";
import { getSession, requireAdmin, requireEngineer, requireUser } from "@/lib/auth";
import type { SessionUser } from "@/types";

type Guard = "public" | "user" | "admin" | "engineer";

export function apiHandler<TContext = unknown>(
  guard: Guard,
  fn: (request: Request, context: TContext, user: SessionUser | null) => Promise<Response>
) {
  return async (request: Request, context: TContext) => {
    try {
      await connectDB();
      const user =
        guard === "public"
          ? await getSession()
          : guard === "admin"
            ? await requireAdmin()
            : guard === "engineer"
              ? await requireEngineer()
              : await requireUser();
      return await fn(request, context, user);
    } catch (error) {
      return fail(error);
    }
  };
}
