import { apiHandler } from "@/lib/api-handler";
import { exportCollection } from "@/lib/services/dashboard";
import { NextResponse } from "next/server";

export const GET = apiHandler("admin", async (_request, ctx: { params: Promise<{ name: string }> }) => {
  const { name } = await ctx.params;
  const rows = (await exportCollection(name)) as Array<Record<string, unknown>>;
  const keys = rows[0] ? Object.keys(rows[0]) : [];
  const csv = [
    keys.join(","),
    ...rows.map((row) =>
      keys
        .map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`)
        .join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
    },
  });
});
