import { Schema, model, models } from "mongoose";

const TicketSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    tktNo: { type: String, required: true },
    openTime: String,
    priority: { type: String, default: "Medium" },
    status: { type: String, default: "Open" },
    eng1Id: { type: Schema.Types.ObjectId, ref: "Engineer" },
    eng2Id: { type: Schema.Types.ObjectId, ref: "Engineer" },
    closeTime: String,
    resolution: String,
    remarks: String,
    slaHours: Number,
    ticketType: { type: String, default: "Support" },
    aEnd: String,
    bEnd: String,
    aOpticalPower: String,
    bOpticalPower: String,
    opticalStatus: { type: String, default: "Pending" },
    affectedPath: { type: String, default: "Main Path" },
    whatsapp: {
      eng1: { sentAt: Date, status: String, error: String },
      eng2: { sentAt: Date, status: String, error: String },
    },
  },
  { timestamps: true }
);

TicketSchema.index({ tktNo: 1 });
TicketSchema.index({ status: 1, openTime: -1 });

export const Ticket = models.Ticket || model("Ticket", TicketSchema);
