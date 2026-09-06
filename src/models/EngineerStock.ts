import { Schema, model, models } from "mongoose";

const EngineerStockSchema = new Schema(
  {
    engineerId: { type: Schema.Types.ObjectId, ref: "Engineer", required: true },
    materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    qty: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

EngineerStockSchema.index({ engineerId: 1, materialId: 1 }, { unique: true });

export const EngineerStock = models.EngineerStock || model("EngineerStock", EngineerStockSchema);
