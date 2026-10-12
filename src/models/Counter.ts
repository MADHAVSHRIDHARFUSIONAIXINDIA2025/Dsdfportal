import { Schema, model, models } from "mongoose";

const CounterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = models.Counter || model("Counter", CounterSchema);
