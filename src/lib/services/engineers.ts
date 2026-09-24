import { randomBytes } from "crypto";
import { AppError } from "@/lib/errors";
import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Engineer, Invite, User } from "@/models";
import { mapEngineer } from "@/lib/services/mappers";
import { normalizePhone } from "@/lib/utils";
import type { z } from "zod";
import type { engineerSchema } from "@/lib/validations";

async function syncEngineerLogin(engineer: { _id: unknown; name: string; mobile: string; status?: string; userId?: unknown; onboardStatus?: string; save: () => Promise<unknown> }, password?: string) {
  const user = await User.findOne({ $or: [{ engineerId: engineer._id }, { mobile: engineer.mobile }] });
  if (!password && !user) return false;

  if (user) {
    user.name = engineer.name;
    user.mobile = engineer.mobile;
    user.role = "engineer";
    user.engineerId = engineer._id;
    user.status = engineer.status === "Inactive" ? "disabled" : "active";
    if (password) user.passwordHash = await hashPassword(password);
    await user.save();
    engineer.userId = user._id;
    if (password || user.passwordHash) engineer.onboardStatus = "active";
    await engineer.save();
    return true;
  }

  if (!password) return false;
  const created = await User.create({
    name: engineer.name,
    role: "engineer",
    mobile: engineer.mobile,
    passwordHash: await hashPassword(password),
    engineerId: engineer._id,
    status: engineer.status === "Inactive" ? "disabled" : "active",
  });
  engineer.userId = created._id;
  engineer.onboardStatus = "active";
  await engineer.save();
  return true;
}

export async function listEngineers() {
  await connectDB();
  const docs = await Engineer.find().sort({ name: 1 }).lean();
  return docs.map((row) => mapEngineer(row as Record<string, unknown>));
}

export async function saveEngineer(input: z.infer<typeof engineerSchema>, id?: string) {
  const { password, ...rest } = input;
  const payload = { ...rest, mobile: normalizePhone(rest.mobile) || rest.mobile };
  const doc = id
    ? await Engineer.findByIdAndUpdate(id, payload, { new: true })
    : await Engineer.create({ ...payload, onboardStatus: password ? "active" : "invited" });
  if (!doc) throw new AppError("Engineer not found", 404);
  const hasPassword = await syncEngineerLogin(doc, password);
  return { ...mapEngineer(doc.toObject()), hasPassword };
}

export async function deleteEngineer(id: string) {
  await Invite.deleteMany({ engineerId: id });
  await User.deleteMany({ engineerId: id });
  await Engineer.findByIdAndDelete(id);
}

export async function createInvite(engineerId: string) {
  const engineer = await Engineer.findById(engineerId);
  if (!engineer) throw new AppError("Engineer not found", 404);

  await Invite.deleteMany({ engineerId, usedAt: { $exists: false } });
  const token = randomBytes(24).toString("hex");
  const invite = await Invite.create({
    token,
    engineerId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  engineer.onboardStatus = "invited";
  await engineer.save();

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    token: invite.token,
    url: `${origin}/ext/onboard/${invite.token}`,
    expiresAt: invite.expiresAt,
    engineer: mapEngineer(engineer.toObject()),
  };
}

export async function getInvite(token: string) {
  const invite = await Invite.findOne({ token }).populate("engineerId");
  if (!invite) throw new AppError("Invite link is invalid", 404);
  if (invite.usedAt) throw new AppError("This invite has already been used");
  if (invite.expiresAt.getTime() < Date.now()) throw new AppError("This invite has expired");
  const engineer = invite.engineerId as { name?: string; mobile?: string; empId?: string };
  return {
    token: invite.token,
    engineerName: engineer?.name || "",
    mobile: engineer?.mobile || "",
    empId: engineer?.empId || "",
    expiresAt: invite.expiresAt,
  };
}

export async function completeOnboard(input: { token: string; password: string; mobile: string }) {
  const invite = await Invite.findOne({ token: input.token });
  if (!invite) throw new AppError("Invite link is invalid", 404);
  if (invite.usedAt) throw new AppError("This invite has already been used");
  if (invite.expiresAt.getTime() < Date.now()) throw new AppError("This invite has expired");

  const engineer = await Engineer.findById(invite.engineerId);
  if (!engineer) throw new AppError("Engineer record was not found", 404);

  const mobile = normalizePhone(input.mobile) || input.mobile;
  const passwordHash = await hashPassword(input.password);
  const existing = await User.findOne({ $or: [{ engineerId: engineer._id }, { mobile }] });

  const user = existing
    ? Object.assign(existing, {
        name: engineer.name,
        role: "engineer",
        mobile,
        passwordHash,
        engineerId: engineer._id,
        status: "active",
      }) && (await existing.save())
    : await User.create({
        name: engineer.name,
        role: "engineer",
        mobile,
        passwordHash,
        engineerId: engineer._id,
        status: "active",
      });

  engineer.mobile = mobile;
  engineer.userId = user._id;
  engineer.onboardStatus = "active";
  engineer.status = "Active";
  await engineer.save();

  invite.usedAt = new Date();
  await invite.save();

  return {
    id: String(user._id),
    name: user.name,
    role: "engineer" as const,
    mobile: user.mobile,
    engineerId: String(engineer._id),
  };
}
