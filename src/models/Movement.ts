import { Schema, model, models } from "mongoose";

const MovementSchema = new Schema(
  {
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    moveType: { type: String, enum: ["INWARD", "ISSUE", "RETURN", "ADJUST"], required: true },
    qty: { type: Number, required: true },
    party: String,
    engineerId: { type: Schema.Types.ObjectId, ref: "Engineer" },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" },
    site: String,
    refNo: String,
    moveTime: String,
    remarks: String,
  },
  { timestamps: true }
);

export const Movement = models.Movement || model("Movement", MovementSchema);
