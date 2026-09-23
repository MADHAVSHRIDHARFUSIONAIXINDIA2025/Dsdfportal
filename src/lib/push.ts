import webpush from "web-push";

export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type TicketPushInput = {
  engineerName: string;
  ticketNo: string;
  ticketType: string;
  customer: string;
  linkId?: string;
  priority: string;
  city?: string;
  status?: string;
};

export function isPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@dsdf.local";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function assignmentPushPayload(input: TicketPushInput) {
  const parts = [
    `${input.ticketType} · ${input.priority}`,
    input.customer || null,
    input.linkId || null,
    input.city || null,
  ].filter(Boolean);

  return {
    title: `New ticket: ${input.ticketNo}`,
    body: `Hi ${input.engineerName}. ${parts.join(" · ")}`,
    url: "/ext/tickets",
    tag: `ticket-${input.ticketNo}`,
  };
}

export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionJSON[],
  payload: Record<string, unknown>
) {
  if (!subscriptions.length) {
    return { ok: false as const, sent: 0, failed: 0, staleEndpoints: [] as string[], error: "No push subscription" };
  }
  if (!isPushConfigured()) {
    return {
      ok: false as const,
      sent: 0,
      failed: 0,
      staleEndpoints: [] as string[],
      dryRun: true as const,
      error: "Push not configured. Add VAPID keys.",
    };
  }

  configureWebPush();
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          body
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        }
        console.error("[push]", error);
      }
    })
  );

  return {
    ok: sent > 0,
    sent,
    failed,
    staleEndpoints,
    dryRun: false as const,
    error: sent > 0 ? undefined : "Push delivery failed",
  };
}
