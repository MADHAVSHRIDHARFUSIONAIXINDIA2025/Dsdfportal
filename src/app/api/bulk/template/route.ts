import { apiHandler } from "@/lib/api-handler";
import { buildBulkTemplateBuffer } from "@/lib/bulk/template";
import { NextResponse } from "next/server";

export const GET = apiHandler("admin", async () => {
  const buffer = await buildBulkTemplateBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="DSDF-bulk-upload-template.xlsx"',
    },
  });
});
