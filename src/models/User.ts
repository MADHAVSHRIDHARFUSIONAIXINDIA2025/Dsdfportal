import { Schema, model, models } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true },
    expirationTime: Number,
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "engineer"], required: true },
    email: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
    mobile: { type: String, trim: true, sparse: true, unique: true },
    passwordHash: { type: String, required: true },
    engineerId: { type: Schema.Types.ObjectId, ref: "Engineer" },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    pushSubscriptions: { type: [PushSubscriptionSchema], default: [] },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
