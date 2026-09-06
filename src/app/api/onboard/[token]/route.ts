import { connectDB } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/http";
import { setSessionCookie } from "@/lib/auth";
import { onboardSchema } from "@/lib/validations";
import { completeOnboard, getInvite } from "@/lib/services/engineers";

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    return ok(await getInvite((await ctx.params).token));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await ctx.params;
    const body = onboardSchema.parse({ ...(await readJson<object>(request)), token });
    const user = await completeOnboard(body);
    await setSessionCookie(user);
    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}
