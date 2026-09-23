import { AppError } from "@/lib/errors";
import { nowLabel } from "@/lib/utils";
import {
  assignmentPushPayload,
  sendPushToSubscriptions,
  type PushSubscriptionJSON,
} from "@/lib/push";
import { notifyTicketAssignment } from "@/lib/whatsapp";
import { Customer, Engineer, Ticket, User } from "@/models";
import { mapTicket } from "@/lib/services/mappers";
import type { z } from "zod";
import type { ticketSchema } from "@/lib/validations";

type TicketInput = z.infer<typeof ticketSchema>;

async function hydrateTicket(input: TicketInput) {
  let aEnd = input.aEnd;
  let bEnd = input.bEnd;
  let slaHours = input.slaHours || 4;
  let affectedPath = input.affectedPath || "Main Path";

  if (input.customerId) {
    const customer = await Customer.findById(input.customerId);
    if (!customer) throw new AppError("Customer / link was not found");

    aEnd = input.aEnd || customer.aEnd;
    bEnd = input.bEnd || customer.bEnd;
    slaHours = input.slaHours || customer.slaHours || 4;
    affectedPath = input.affectedPath || customer.pathName || "Main Path";

    if (customer.linkType === "Linear") affectedPath = "Main Path";
  }

  if (!aEnd || !bEnd) {
    throw new AppError("A-End and B-End are required for this ticket");
  }

  const ticketType = input.ticketType || "Support";
  const opticalStatus = input.opticalStatus || "Pending";
  if (ticketType === "Implementation" && opticalStatus !== "OK") {
    throw new AppError("Implementation ticket can be saved only when Optical Power Status is OK");
  }

  return {
    ...input,
    customerId: input.customerId || undefined,
    aEnd,
    bEnd,
    ticketType,
    opticalStatus,
    affectedPath,
    openTime: input.openTime || nowLabel(),
    slaHours,
    eng1Id: input.eng1Id || undefined,
    eng2Id: input.eng2Id || undefined,
  };
}

export type AssignmentNotice = {
  engineer: string;
  channel: "push" | "whatsapp" | "none";
  status: "sent" | "dry-run" | "failed" | "skipped";
  error?: string;
  whatsappLink?: string | null;
};

async function removeStaleSubscriptions(userId: string, endpoints: string[]) {
  if (!endpoints.length) return;
  await User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint: { $in: endpoints } } } }
  );
}

async function notifyIfAssigned(ticketId: string, prev?: { eng1Id?: string; eng2Id?: string }) {
  const notices: AssignmentNotice[] = [];
  const ticket = await Ticket.findById(ticketId)
    .populate("customerId")
    .populate("eng1Id")
    .populate("eng2Id");
  if (!ticket) return notices;

  const customer = ticket.customerId as {
    name?: string;
    linkId?: string;
    city?: string;
    aEnd?: string;
    bEnd?: string;
  };

  const jobs = [
    { key: "eng1" as const, engineer: ticket.eng1Id as { _id?: unknown; name?: string; mobile?: string } | null, prevId: prev?.eng1Id },
    { key: "eng2" as const, engineer: ticket.eng2Id as { _id?: unknown; name?: string; mobile?: string } | null, prevId: prev?.eng2Id },
  ];

  for (const job of jobs) {
    const nextId = job.engineer?._id ? String(job.engineer._id) : "";
    if (!nextId || nextId === job.prevId) continue;
    const name = job.engineer?.name || "Engineer";

    const notifyInput = {
      engineerName: name,
      ticketNo: ticket.tktNo,
      ticketType: ticket.ticketType,
      customer: customer?.name || "",
      linkId: customer?.linkId,
      priority: ticket.priority,
      city: customer?.city,
      status: ticket.status,
      aEnd: ticket.aEnd || customer?.aEnd,
      bEnd: ticket.bEnd || customer?.bEnd,
      openTime: ticket.openTime,
      slaHours: ticket.slaHours,
      affectedPath: ticket.affectedPath,
      remarks: ticket.remarks,
      to: job.engineer?.mobile || "",
    };

    const user = await User.findOne({ engineerId: nextId }).select("pushSubscriptions");
    const subscriptions = (user?.pushSubscriptions || []) as PushSubscriptionJSON[];

    if (subscriptions.length) {
      const pushResult = await sendPushToSubscriptions(subscriptions, assignmentPushPayload(notifyInput));
      if (user && pushResult.staleEndpoints.length) {
        await removeStaleSubscriptions(String(user._id), pushResult.staleEndpoints);
      }

      if (pushResult.ok) {
        ticket.whatsapp = ticket.whatsapp || {};
        ticket.whatsapp[job.key] = {
          sentAt: new Date(),
          status: "sent",
          error: "push",
        };
        notices.push({ engineer: name, channel: "push", status: "sent" });
        continue;
      }

      if ("dryRun" in pushResult && pushResult.dryRun) {
        // VAPID missing — fall through to WhatsApp
      } else if (!job.engineer?.mobile) {
        notices.push({
          engineer: name,
          channel: "push",
          status: "failed",
          error: pushResult.error || "Push failed and no WhatsApp number",
        });
        continue;
      }
    }

    // WhatsApp fallback when no push subscription (or push not configured / failed)
    if (!job.engineer?.mobile) {
      notices.push({
        engineer: name,
        channel: "none",
        status: "skipped",
        error: subscriptions.length
          ? "Push failed and engineer has no WhatsApp mobile"
          : "Enable push in field app, or add WhatsApp mobile",
      });
      continue;
    }

    const result = await notifyTicketAssignment(notifyInput);
    const status = result.ok ? "sent" : result.dryRun ? "dry-run" : "failed";
    const whatsappLink = "whatsappLink" in result ? result.whatsappLink : undefined;
    ticket.whatsapp = ticket.whatsapp || {};
    ticket.whatsapp[job.key] = {
      sentAt: new Date(),
      status,
      error: "error" in result ? result.error || "" : "",
    };
    notices.push({
      engineer: name,
      channel: "whatsapp",
      status,
      error: "error" in result ? result.error : undefined,
      whatsappLink,
    });
  }

  await ticket.save();
  return notices;
}

export async function listTickets(filter?: { engineerId?: string }) {
  const query = filter?.engineerId
    ? { $or: [{ eng1Id: filter.engineerId }, { eng2Id: filter.engineerId }] }
    : {};
  const rows = await Ticket.find(query)
    .populate("customerId")
    .populate("eng1Id")
    .populate("eng2Id")
    .sort({ createdAt: -1 })
    .lean();
  return rows.map((row) => mapTicket(row as Record<string, unknown>));
}

export async function saveTicket(input: TicketInput, id?: string) {
  const payload = await hydrateTicket(input);
  const prev = id ? await Ticket.findById(id).lean() : null;
  const doc = id
    ? await Ticket.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
    : await Ticket.create(payload);
  if (!doc) throw new AppError("Ticket not found", 404);

  const notifications = await notifyIfAssigned(String(doc._id), {
    eng1Id: prev?.eng1Id ? String(prev.eng1Id) : "",
    eng2Id: prev?.eng2Id ? String(prev.eng2Id) : "",
  });

  const full = await Ticket.findById(doc._id).populate("customerId").populate("eng1Id").populate("eng2Id").lean();
  return { ...mapTicket(full as Record<string, unknown>), notifications };
}

export async function deleteTicket(id: string) {
  await Ticket.findByIdAndDelete(id);
}

export async function getEngineersByIds(ids: string[]) {
  return Engineer.find({ _id: { $in: ids.filter(Boolean) } });
}
