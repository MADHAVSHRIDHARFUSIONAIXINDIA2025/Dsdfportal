import { connectDB } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/http";
import { hashPassword } from "@/lib/auth";
import { setupSchema } from "@/lib/validations";
import { User } from "@/models";

export async function GET() {
  try {
    await connectDB();
    const count = await User.countDocuments({ role: "admin" });
    return ok({ needsSetup: count === 0 });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    if (await User.countDocuments({ role: "admin" })) {
      return fail(new Error("Admin already exists"));
    }
    const body = setupSchema.parse(await readJson(request));
    await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      role: "admin",
      status: "active",
    });
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
