import { Schema, model, models } from "mongoose";

const MaterialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    partNo: String,
    unit: { type: String, default: "Nos" },
    opening: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    remarks: String,
  },
  { timestamps: true }
);

MaterialSchema.index({ name: 1 }, { unique: true });

export const Material = models.Material || model("Material", MaterialSchema);
