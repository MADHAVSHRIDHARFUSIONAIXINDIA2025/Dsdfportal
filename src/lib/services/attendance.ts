import { AppError } from "@/lib/errors";
import { Attendance, Engineer } from "@/models";
import { mapAttendance } from "@/lib/services/mappers";
import type { z } from "zod";
import type { attendanceSchema } from "@/lib/validations";

export async function listAttendance(engineerId?: string) {
  const query = engineerId ? { engineerId } : {};
  const rows = await Attendance.find(query).populate("engineerId").sort({ attDate: -1 }).lean();
  return rows.map((row) => mapAttendance(row as Record<string, unknown>));
}

export async function saveAttendance(input: z.infer<typeof attendanceSchema>, id?: string) {
  const existing = id
    ? await Attendance.findById(id)
    : await Attendance.findOne({ engineerId: input.engineerId, attDate: input.attDate });

  const doc = existing
    ? Object.assign(existing, input) && (await existing.save())
    : await Attendance.create(input);

  const full = await Attendance.findById(doc._id).populate("engineerId").lean();
  return mapAttendance(full as Record<string, unknown>);
}

export async function attendanceReport(input: {
  from: string;
  to: string;
  engineerId?: string;
  status?: string;
}) {
  const engineers = await Engineer.find(input.engineerId ? { _id: input.engineerId } : {}).lean();
  const rows = await Attendance.find({
    attDate: { $gte: input.from, $lte: input.to },
    ...(input.engineerId ? { engineerId: input.engineerId } : {}),
  })
    .populate("engineerId")
    .lean();

  const map = new Map(rows.map((row) => [`${row.engineerId?._id || row.engineerId}|${row.attDate}`, row]));
  const result: ReturnType<typeof mapAttendance>[] = [];
  const cursor = new Date(`${input.from}T00:00:00`);
  const last = new Date(`${input.to}T00:00:00`);

  while (cursor <= last) {
    const date = cursor.toISOString().slice(0, 10);
    for (const engineer of engineers) {
      const current = map.get(`${engineer._id}|${date}`);
      const mapped = current
        ? mapAttendance(current as Record<string, unknown>)
        : {
            id: `virtual-${engineer._id}-${date}`,
            engineerId: String(engineer._id),
            engineer: engineer.name,
            attDate: date,
            inTime: "",
            outTime: "",
            status: "Absent",
            remarks: "No attendance entry",
          };
      if (!input.status || mapped.status === input.status) result.push(mapped);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export async function deleteAttendance(id: string) {
  const row = await Attendance.findByIdAndDelete(id);
  if (!row) throw new AppError("Attendance not found", 404);
}
