import ExcelJS from "exceljs";

export type BulkSheetName = "Companies" | "Links" | "Engineers" | "Tickets";

export const BULK_SHEETS: Record<
  BulkSheetName,
  { headers: string[]; sample: string[]; notes: string }
> = {
  Companies: {
    notes: "Create companies first. Links and tickets refer to company by Company Name.",
    headers: ["Company Name*", "Contact", "Email", "Address", "Status", "Remarks"],
    sample: ["Acme Fiber Pvt Ltd", "9876543210", "ops@acme.com", "Mirzapur", "Active", ""],
  },
  Links: {
    notes:
      "Company Name* must match Companies sheet. Link ID optional except Vodafone Idea Limited. Link Type: Linear | Link Protection. Path: Main Path | Protection Path.",
    headers: [
      "Customer Name*",
      "Company Name*",
      "City*",
      "Link ID",
      "Link Type",
      "Path Name",
      "Fiber Core",
      "Customer Category",
      "Manage By",
      "Vendor Name",
      "Vendor Contact",
      "Service Type",
      "Bandwidth",
      "A-End",
      "B-End",
      "A-End Latitude",
      "A-End Longitude",
      "B-End Latitude",
      "B-End Longitude",
      "Implementation Date",
      "Contact",
      "SLA Hours",
      "Status",
      "Remarks",
    ],
    sample: [
      "City Mall Link",
      "Acme Fiber Pvt Ltd",
      "Mirzapur",
      "",
      "Linear",
      "Main Path",
      "Single Core",
      "Enterprise",
      "Manage By Own",
      "",
      "",
      "Internet",
      "100 Mbps",
      "A Site",
      "B Site",
      "",
      "",
      "",
      "",
      "2026-01-15",
      "9876501234",
      "4",
      "Active",
      "",
    ],
  },
  Engineers: {
    notes: "Mobile* is used for login and WhatsApp. Password optional (min 8) to activate login immediately.",
    headers: [
      "Name*",
      "Mobile*",
      "Emp ID",
      "Post",
      "Department",
      "Joining Date",
      "Status",
      "Area / City",
      "Password",
    ],
    sample: ["Rahul Kumar", "9876543210", "FE001", "Field Engineer", "Ops", "2025-06-01", "Active", "Mirzapur", ""],
  },
  Tickets: {
    notes:
      "Link ID* or Customer Name to attach link. Eng1 Mobile / Eng2 Mobile match Engineers sheet. Type: Support | Implementation. Priority: Low | Medium | High | Critical.",
    headers: [
      "Ticket No*",
      "Link ID",
      "Customer Name",
      "Ticket Type",
      "Priority",
      "Status",
      "Eng1 Mobile",
      "Eng2 Mobile",
      "Open Time",
      "Close Time",
      "A-End",
      "B-End",
      "SLA Hours",
      "Optical Status",
      "Affected Path",
      "Resolution",
      "Remarks",
    ],
    sample: [
      "CMP-1001",
      "",
      "City Mall Link",
      "Support",
      "Medium",
      "Open",
      "9876543210",
      "",
      "2026-09-20 10:00",
      "",
      "A Site",
      "B Site",
      "4",
      "Pending",
      "Main Path",
      "",
      "Fiber cut",
    ],
  },
};

export async function buildBulkTemplateBuffer() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DSDF Fiber Ops";
  wb.created = new Date();

  // Instructions sheet
  const intro = wb.addWorksheet("Instructions");
  intro.getColumn(1).width = 100;
  intro.addRow(["DSDF Fiber Ops — Bulk Upload Template"]);
  intro.addRow([""]);
  intro.addRow(["1. Fill Companies first, then Links, Engineers, then Tickets."]);
  intro.addRow(["2. Columns marked with * are required."]);
  intro.addRow(["3. Do not rename sheet names or header row."]);
  intro.addRow(["4. Leave optional cells blank if not needed."]);
  intro.addRow(["5. Upload this file from Admin → Bulk Upload."]);
  intro.addRow([""]);
  intro.addRow(["Sheet notes:"]);
  (Object.keys(BULK_SHEETS) as BulkSheetName[]).forEach((name) => {
    intro.addRow([`${name}: ${BULK_SHEETS[name].notes}`]);
  });
  intro.getRow(1).font = { bold: true, size: 14 };

  (Object.keys(BULK_SHEETS) as BulkSheetName[]).forEach((name) => {
    const def = BULK_SHEETS[name];
    const ws = wb.addWorksheet(name);
    const header = ws.addRow(def.headers);
    header.font = { bold: true };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B1F3A" },
    };
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.addRow(def.sample);
    def.headers.forEach((_, i) => {
      ws.getColumn(i + 1).width = Math.min(28, Math.max(14, def.headers[i].length + 2));
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
  });

  // Keep compatibility with user's empty template sheet names as aliases in notes
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function normalizeHeader(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\*$/, "");
}

export function sheetRowsToObjects(headers: string[], rows: unknown[][]) {
  const keys = headers.map(normalizeHeader);
  return rows
    .map((row) => {
      const obj: Record<string, string> = {};
      keys.forEach((key, i) => {
        if (!key) return;
        const raw = row[i];
        obj[key] = raw == null ? "" : String(raw).trim();
      });
      return obj;
    })
    .filter((obj) => Object.values(obj).some((v) => v));
}
