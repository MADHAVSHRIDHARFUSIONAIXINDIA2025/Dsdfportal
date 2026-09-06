import { Schema, model, models } from "mongoose";

const TicketMaterialSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    qty: { type: Number, required: true },
    site: String,
    usedBy: { type: Schema.Types.ObjectId, ref: "Engineer", required: true },
    usedTime: String,
    remarks: String,
    materialName: String,
  },
  { timestamps: true }
);

export const TicketMaterial = models.TicketMaterial || model("TicketMaterial", TicketMaterialSchema);
