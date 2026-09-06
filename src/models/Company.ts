import { Schema, model, models } from "mongoose";

const CompanySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    contact: String,
    email: String,
    address: String,
    status: { type: String, default: "Active" },
    remarks: String,
  },
  { timestamps: true }
);

export const Company = models.Company || model("Company", CompanySchema);
