import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { ok } from "@/lib/http";
import { User } from "@/models";

type SubBody = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: { p256dh?: string; auth?: string };
  userAgent?: string;
};

export const POST = apiHandler("engineer", async (request, _ctx, user) => {
  const body = (await request.json()) as SubBody;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    throw new AppError("Invalid push subscription", 400);
  }

  const doc = await User.findById(user!.id);
  if (!doc) throw new AppError("User not found", 404);

  const next = {
    endpoint: body.endpoint,
    expirationTime: body.expirationTime ?? undefined,
    keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
    userAgent: body.userAgent || "",
    createdAt: new Date(),
  };

  const existing = (doc.pushSubscriptions || []) as Array<{ endpoint: string }>;
  doc.pushSubscriptions = [
    ...existing.filter((item) => item.endpoint !== body.endpoint),
    next,
  ];
  await doc.save();

  return ok({ subscribed: true, count: doc.pushSubscriptions.length });
});

export const DELETE = apiHandler("engineer", async (request, _ctx, user) => {
  const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
  const doc = await User.findById(user!.id);
  if (!doc) throw new AppError("User not found", 404);

  if (body.endpoint) {
    doc.pushSubscriptions = (doc.pushSubscriptions || []).filter(
      (item: { endpoint: string }) => item.endpoint !== body.endpoint
    );
  } else {
    doc.pushSubscriptions = [];
  }
  await doc.save();

  return ok({ subscribed: false, count: doc.pushSubscriptions.length });
});

export const GET = apiHandler("engineer", async (_request, _ctx, user) => {
  const doc = await User.findById(user!.id).select("pushSubscriptions").lean();
  const count = Array.isArray(doc?.pushSubscriptions) ? doc.pushSubscriptions.length : 0;
  return ok({ subscribed: count > 0, count });
});
