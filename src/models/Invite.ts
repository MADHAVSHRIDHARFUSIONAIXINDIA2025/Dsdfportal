import { Schema, model, models } from "mongoose";

const InviteSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    engineerId: { type: Schema.Types.ObjectId, ref: "Engineer", required: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: true }
);

export const Invite = models.Invite || model("Invite", InviteSchema);
