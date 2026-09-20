import { COMPANY_LEGAL } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

export type TicketNotifyInput = {
  to: string;
  engineerName: string;
  ticketNo: string;
  ticketType: string;
  customer: string;
  linkId?: string;
  priority: string;
  city?: string;
  status?: string;
  aEnd?: string;
  bEnd?: string;
  openTime?: string;
  slaHours?: number | string;
  affectedPath?: string;
  remarks?: string;
};

function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_WHATSAPP_FROM || "";
  const contentSid = process.env.TWILIO_CONTENT_SID || "";
  return { accountSid, authToken, from, contentSid };
}

export function isWhatsAppConfigured() {
  const { accountSid, authToken, from } = twilioConfig();
  return Boolean(accountSid && authToken && from);
}

export function toWhatsAppAddress(mobile: string) {
  const phone = normalizePhone(mobile);
  if (!phone) return "";
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:+${phone}`;
}

export function assignmentMessage(input: TicketNotifyInput) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return [
    COMPANY_LEGAL,
    `Hello ${input.engineerName}, a ticket has been assigned to you.`,
    "",
    `Ticket: ${input.ticketNo}`,
    `Type: ${input.ticketType}`,
    `Priority: ${input.priority}`,
    input.status ? `Status: ${input.status}` : "",
    `Customer: ${input.customer || "—"}`,
    input.linkId ? `Link ID: ${input.linkId}` : "",
    input.city ? `City: ${input.city}` : "",
    input.aEnd || input.bEnd ? `Path: ${input.aEnd || "—"} → ${input.bEnd || "—"}` : "",
    input.affectedPath ? `Affected path: ${input.affectedPath}` : "",
    input.openTime ? `Open time: ${input.openTime}` : "",
    input.slaHours != null && input.slaHours !== "" ? `SLA: ${input.slaHours} hrs` : "",
    input.remarks ? `Remarks: ${input.remarks}` : "",
    "",
    `Open field app: ${appUrl}/ext/tickets`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Short lines for Content template placeholders {{1}} {{2}} {{3}} ... */
export function ticketDetailLines(input: TicketNotifyInput) {
  const path = [input.aEnd, input.bEnd].filter(Boolean).join(" → ");
  return {
    engineer: input.engineerName || "Engineer",
    ticketNo: input.ticketNo || "-",
    summary: `${input.ticketType || "-"} | ${input.priority || "-"} | ${input.status || "Open"}`,
    customer: input.customer || "-",
    link: input.linkId || "-",
    city: input.city || "-",
    path: path || "-",
    openTime: input.openTime || "-",
    sla: input.slaHours != null && input.slaHours !== "" ? `${input.slaHours} hrs` : "-",
    remarks: (input.remarks || "-").slice(0, 120),
    details: [
      `TKT ${input.ticketNo}`,
      input.ticketType,
      input.priority,
      input.customer,
      input.linkId,
      input.city,
      path,
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 200),
  };
}

export function generateWhatsAppLink(input: TicketNotifyInput) {
  const phone = normalizePhone(input.to);
  const message = assignmentMessage(input);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}

function contentVariables(input: TicketNotifyInput) {
  const d = ticketDetailLines(input);
  // Pack ticket fields into common {{1}}..{{12}} slots used by Content templates
  return JSON.stringify({
    "1": d.engineer,
    "2": d.ticketNo,
    "3": d.summary,
    "4": d.customer,
    "5": d.link,
    "6": d.city,
    "7": d.path,
    "8": d.openTime,
    "9": d.sla,
    "10": d.remarks,
    "11": d.details,
    "12": d.details,
  });
}

export async function sendTwilioWhatsApp(to: string, body: string, input?: TicketNotifyInput) {
  const { accountSid, authToken, from, contentSid } = twilioConfig();
  const toAddr = toWhatsAppAddress(to);

  if (!toAddr) throw new Error("WhatsApp number is missing");
  if (!accountSid || !authToken || !from) {
    console.info("[whatsapp:dry-run]", { to: toAddr, body });
    return {
      ok: false as const,
      dryRun: true as const,
      error: "Twilio WhatsApp is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.",
    };
  }

  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  async function postMessage(payload: URLSearchParams) {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        data?.message ||
        data?.error_message ||
        (typeof data === "string" ? data : "Twilio WhatsApp send failed");
      throw new Error(message);
    }
    return data;
  }

  const notifyInput =
    input ||
    ({
      to,
      engineerName: "",
      ticketNo: "",
      ticketType: "",
      customer: "",
      priority: "",
    } satisfies TicketNotifyInput);

  // 1) Try freeform Body first (full ticket details — works in sandbox / 24h session)
  try {
    const bodyParams = new URLSearchParams();
    bodyParams.set("To", toAddr);
    bodyParams.set("From", fromAddr);
    bodyParams.set("Body", body);
    const data = await postMessage(bodyParams);
    return { ok: true as const, dryRun: false as const, data, mode: "body" as const };
  } catch (bodyError) {
    console.warn("[whatsapp] Body send failed (common outside 24h window):", bodyError);
  }

  // 2) Fall back to ContentSid so the message still delivers on WhatsApp
  if (!contentSid) {
    throw new Error(
      "WhatsApp Body failed and TWILIO_CONTENT_SID is not set. On trial accounts use ContentSid, or have the engineer join the Twilio sandbox."
    );
  }

  const params = new URLSearchParams();
  params.set("To", toAddr);
  params.set("From", fromAddr);
  params.set("ContentSid", contentSid);
  params.set("ContentVariables", contentVariables(notifyInput));
  const data = await postMessage(params);
  return { ok: true as const, dryRun: false as const, data, mode: "content" as const };
}

/** @deprecated Meta Cloud API — use Twilio via sendTwilioWhatsApp */
export async function sendWhatsAppText(to: string, body: string) {
  return sendTwilioWhatsApp(to, body);
}

export async function notifyTicketAssignment(input: TicketNotifyInput) {
  if (!isWhatsAppConfigured()) {
    return {
      ok: false as const,
      dryRun: true as const,
      whatsappLink: generateWhatsAppLink(input),
      error: "Twilio WhatsApp not configured. Click the link to send manually.",
    };
  }

  try {
    const body = assignmentMessage(input);
    return await sendTwilioWhatsApp(input.to, body, input);
  } catch (error) {
    console.error("[whatsapp]", error);
    return {
      ok: false as const,
      dryRun: false as const,
      whatsappLink: generateWhatsAppLink(input),
      error: error instanceof Error ? error.message : "WhatsApp failed",
    };
  }
}

export async function notifyOnboarding(to: string, name: string, url: string) {
  const body = [
    COMPANY_LEGAL,
    `Hello ${name}, your field app access is ready.`,
    `Open this onboarding link on your phone:`,
    url,
    `Set your WhatsApp number and password to activate.`,
  ].join("\n");

  try {
    return await sendTwilioWhatsApp(to, body);
  } catch (error) {
    console.error("[whatsapp]", error);
    return { ok: false as const, error: error instanceof Error ? error.message : "WhatsApp failed" };
  }
}
