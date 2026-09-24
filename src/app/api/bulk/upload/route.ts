import { apiHandler } from "@/lib/api-handler";
import { importBulkWorkbook } from "@/lib/bulk/import";
import { AppError } from "@/lib/errors";
import { ok } from "@/lib/http";

export const POST = apiHandler("admin", async (request) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    throw new AppError("Upload an Excel (.xlsx) file");
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    throw new AppError("Only Excel files (.xlsx) are supported");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength < 64) {
    throw new AppError("File is empty or invalid");
  }
  const summary = await importBulkWorkbook(buffer);
  return ok(summary);
});
