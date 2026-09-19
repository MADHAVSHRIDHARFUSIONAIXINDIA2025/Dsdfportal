import { Schema, model, models } from "mongoose";

const JointClosureSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    engineerId: { type: Schema.Types.ObjectId, ref: "Engineer", required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    imageUrl: { type: String, required: true },
    remarks: String,
  },
  { timestamps: true }
);

JointClosureSchema.index({ ticketId: 1 });
JointClosureSchema.index({ customerId: 1 });

export const JointClosure = models.JointClosure || model("JointClosure", JointClosureSchema);
