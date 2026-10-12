import { AppError } from "@/lib/errors";
import { Counter, Ticket } from "@/models";

const PREFIX = "DSDF/";
const WIDTH = 6;

export function formatTicketNo(seq: number) {
  return `${PREFIX}${String(seq).padStart(WIDTH, "0")}`;
}

async function highestExistingSeq() {
  const rows = await Ticket.find({ tktNo: /^DSDF\/\d+$/i }).select("tktNo").lean();
  let max = 0;
  for (const row of rows) {
    const match = String(row.tktNo || "").match(/^DSDF\/(\d+)$/i);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

async function bump() {
  const doc = await Counter.findOneAndUpdate({ key: "ticket" }, { $inc: { seq: 1 } }, { new: true });
  if (!doc) throw new AppError("Could not allocate ticket number");
  return Number(doc.seq);
}

/**
 * Next serial ticket number: DSDF/000001, DSDF/000002, …
 * Soft-deleted tickets stay in the collection, so their numbers are never issued again.
 */
export async function nextTicketNo() {
  const seeded = await Counter.findOne({ key: "ticket" });
  if (!seeded) {
    const max = await highestExistingSeq();
    await Counter.updateOne({ key: "ticket" }, { $setOnInsert: { seq: max } }, { upsert: true });
  }

  let seq = await bump();
  let ticketNo = formatTicketNo(seq);
  while (await Ticket.exists({ tktNo: ticketNo })) {
    seq = await bump();
    ticketNo = formatTicketNo(seq);
  }
  return ticketNo;
}
