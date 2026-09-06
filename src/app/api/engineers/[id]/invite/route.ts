import { apiHandler } from "@/lib/api-handler";
import { ok } from "@/lib/http";
import { createInvite } from "@/lib/services/engineers";
import { notifyOnboarding } from "@/lib/whatsapp";
import { Engineer } from "@/models";

export const POST = apiHandler("admin", async (request, ctx: { params: Promise<{ id: string }> }) => {
  const invite = await createInvite((await ctx.params).id);
  const engineer = await Engineer.findById(invite.engineer.id);
  const notify = new URL(request.url).searchParams.get("whatsapp") === "1";
  if (notify && engineer?.mobile) {
    await notifyOnboarding(engineer.mobile, engineer.name, invite.url);
  }
  return ok(invite);
});
