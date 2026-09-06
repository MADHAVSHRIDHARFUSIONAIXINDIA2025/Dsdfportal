import { Schema, model, models } from "mongoose";

const AttendanceSchema = new Schema(
  {
    engineerId: { type: Schema.Types.ObjectId, ref: "Engineer", required: true },
    attDate: { type: String, required: true },
    inTime: String,
    outTime: String,
    status: { type: String, required: true },
    remarks: String,
  },
  { timestamps: true }
);

AttendanceSchema.index({ engineerId: 1, attDate: 1 }, { unique: true });

export const Attendance = models.Attendance || model("Attendance", AttendanceSchema);
