import { Schema, model, models } from "mongoose";

const EngineerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    empId: String,
    post: String,
    department: String,
    mobile: { type: String, required: true, trim: true },
    joiningDate: String,
    status: { type: String, default: "Active" },
    area: String,
    onboardStatus: { type: String, enum: ["invited", "active", "disabled"], default: "invited" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Engineer = models.Engineer || model("Engineer", EngineerSchema);
