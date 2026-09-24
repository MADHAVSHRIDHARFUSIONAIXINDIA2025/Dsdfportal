import ExcelJS from "exceljs";
import { ZodError } from "zod";
import { companySchema, customerSchema, engineerSchema, ticketSchema } from "@/lib/validations";
import { saveCompany } from "@/lib/services/masters";
import { saveCustomer } from "@/lib/services/customers";
import { saveEngineer } from "@/lib/services/engineers";
import { saveTicket } from "@/lib/services/tickets";
import { Company, Customer, Engineer, Ticket } from "@/models";
import { normalizeHeader, sheetRowsToObjects } from "@/lib/bulk/template";
import { normalizePhone } from "@/lib/utils";

export type BulkRowResult = {
  sheet: string;
  row: number;
  ok: boolean;
  message: string;
};

export type BulkImportSummary = {
  created: Record<string, number>;
  updated: Record<string, number>;
  failed: Record<string, number>;
  results: BulkRowResult[];
};

function errMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message || "Validation failed";
  }
  if (error instanceof Error) return error.message;
  return "Failed";
}

function cell(obj: Record<string, string>, ...aliases: string[]) {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (obj[key] != null && obj[key] !== "") return obj[key];
  }
  return "";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatCellValue(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "object" && v !== null && "text" in v) {
    return String((v as { text: string }).text ?? "").trim();
  }
  if (typeof v === "object" && v !== null && "result" in v) {
    return formatCellValue((v as { result: unknown }).result);
  }
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    const hh = String(v.getHours()).padStart(2, "0");
    const mm = String(v.getMinutes()).padStart(2, "0");
    return v.getHours() || v.getMinutes() ? `${y}-${m}-${d} ${hh}:${mm}` : `${y}-${m}-${d}`;
  }
  // Excel date serial (days since 1899-12-30)
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const epoch = Date.UTC(1899, 11, 30) + Math.round(v * 86400000);
    return formatCellValue(new Date(epoch));
  }
  if (typeof v === "number") {
    // Avoid scientific notation for phones / IDs
    if (Number.isInteger(v) && Math.abs(v) >= 1e10) return v.toFixed(0);
    if (Number.isInteger(v)) return String(v);
    return String(v);
  }
  return String(v).trim();
}

async function readSheetMap(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const map = new Map<string, { headers: string[]; rows: unknown[][]; startRow: number }>();

  wb.eachSheet((ws) => {
    const name = ws.name.trim();
    const matrix: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      matrix.push(values.map((v) => formatCellValue(v)));
    });
    if (!matrix.length) {
      map.set(name.toLowerCase(), { headers: [], rows: [], startRow: 2 });
      return;
    }
    const headers = matrix[0].map((h) => String(h || ""));
    map.set(name.toLowerCase(), { headers, rows: matrix.slice(1), startRow: 2 });
  });

  return map;
}

function pickSheet(
  map: Map<string, { headers: string[]; rows: unknown[][]; startRow: number }>,
  names: string[]
) {
  for (const name of names) {
    const hit = map.get(name.toLowerCase());
    if (hit?.headers.length) return { name, ...hit };
  }
  return null;
}

function looksLikeLinks(headers: string[]) {
  return headers.some((h) => /customer\s*name|city|link\s*id|a-end|b-end/i.test(h));
}

function looksLikeCompanies(headers: string[]) {
  return headers.some((h) => /^company\s*name/i.test(h)) && !looksLikeLinks(headers);
}

async function findEngineerByMobile(mobile: string) {
  const normalized = normalizePhone(mobile) || mobile;
  const digits = mobile.replace(/\D/g, "");
  const local = digits.length >= 10 ? digits.slice(-10) : digits;
  return (
    (await Engineer.findOne({ mobile: normalized })) ||
    (await Engineer.findOne({ mobile })) ||
    (await Engineer.findOne({ mobile: local })) ||
    (await Engineer.findOne({ mobile: digits })) ||
    (local ? await Engineer.findOne({ mobile: { $regex: `${escapeRegex(local)}$` } }) : null)
  );
}

export async function importBulkWorkbook(buffer: Buffer): Promise<BulkImportSummary> {
  const map = await readSheetMap(buffer);
  const summary: BulkImportSummary = {
    created: { Companies: 0, Links: 0, Engineers: 0, Tickets: 0 },
    updated: { Companies: 0, Links: 0, Engineers: 0, Tickets: 0 },
    failed: { Companies: 0, Links: 0, Engineers: 0, Tickets: 0 },
    results: [],
  };

  // Companies
  let companiesSheet = pickSheet(map, ["Companies", "Company"]);
  if (!companiesSheet) {
    const alias = pickSheet(map, ["Companies link"]);
    if (alias && looksLikeCompanies(alias.headers)) companiesSheet = alias;
  }
  if (companiesSheet) {
    const objects = sheetRowsToObjects(companiesSheet.headers, companiesSheet.rows);
    for (let i = 0; i < objects.length; i++) {
      const rowNum = companiesSheet.startRow + i;
      const obj = objects[i];
      try {
        const payload = companySchema.parse({
          name: cell(obj, "Company Name", "name"),
          contact: cell(obj, "Contact"),
          email: cell(obj, "Email"),
          address: cell(obj, "Address"),
          status: cell(obj, "Status") || "Active",
          remarks: cell(obj, "Remarks"),
        });
        const existing = await Company.findOne({ name: new RegExp(`^${escapeRegex(payload.name)}$`, "i") });
        if (existing) {
          await saveCompany(payload, String(existing._id));
          summary.updated.Companies += 1;
          summary.results.push({ sheet: "Companies", row: rowNum, ok: true, message: `Updated ${payload.name}` });
        } else {
          await saveCompany(payload);
          summary.created.Companies += 1;
          summary.results.push({ sheet: "Companies", row: rowNum, ok: true, message: `Created ${payload.name}` });
        }
      } catch (error) {
        summary.failed.Companies += 1;
        summary.results.push({ sheet: "Companies", row: rowNum, ok: false, message: errMessage(error) });
      }
    }
  }

  // Links / Customers
  let linksSheet = pickSheet(map, ["Links", "Customers", "Customer"]);
  if (!linksSheet) {
    const alias = pickSheet(map, ["Companies link"]);
    if (alias && looksLikeLinks(alias.headers)) linksSheet = alias;
  }
  if (linksSheet) {
    const objects = sheetRowsToObjects(linksSheet.headers, linksSheet.rows);
    for (let i = 0; i < objects.length; i++) {
      const rowNum = linksSheet.startRow + i;
      const obj = objects[i];
      try {
        const companyName = cell(obj, "Company Name", "company");
        const company = await Company.findOne({ name: new RegExp(`^${escapeRegex(companyName)}$`, "i") });
        if (!company) throw new Error(`Company not found: ${companyName || "(blank)"}`);

        const payload = customerSchema.parse({
          name: cell(obj, "Customer Name", "name", "Customer"),
          companyId: String(company._id),
          city: cell(obj, "City"),
          linkId: cell(obj, "Link ID", "LinkId"),
          linkType: cell(obj, "Link Type") || "Linear",
          pathName: cell(obj, "Path Name", "Path") || "Main Path",
          fiberCore: cell(obj, "Fiber Core") || "Single Core",
          customerCategory: cell(obj, "Customer Category", "Customer Type") || "Enterprise",
          manageBy: cell(obj, "Manage By") || "Manage By Own",
          vendorName: cell(obj, "Vendor Name"),
          vendorContact: cell(obj, "Vendor Contact"),
          serviceType: cell(obj, "Service Type"),
          bandwidth: cell(obj, "Bandwidth"),
          aEnd: cell(obj, "A-End", "A End"),
          bEnd: cell(obj, "B-End", "B End"),
          aEndLatitude: cell(obj, "A-End Latitude"),
          aEndLongitude: cell(obj, "A-End Longitude"),
          bEndLatitude: cell(obj, "B-End Latitude"),
          bEndLongitude: cell(obj, "B-End Longitude"),
          implementationDate: cell(obj, "Implementation Date"),
          contact: cell(obj, "Contact"),
          slaHours: cell(obj, "SLA Hours") || 4,
          status: cell(obj, "Status") || "Active",
          remarks: cell(obj, "Remarks"),
        });

        const linkId = payload.linkId?.trim();
        const existing = linkId
          ? await Customer.findOne({ linkId })
          : await Customer.findOne({
              name: new RegExp(`^${escapeRegex(payload.name)}$`, "i"),
              companyId: company._id,
              city: new RegExp(`^${escapeRegex(payload.city)}$`, "i"),
            });

        if (existing) {
          await saveCustomer(payload, String(existing._id));
          summary.updated.Links += 1;
          summary.results.push({ sheet: "Links", row: rowNum, ok: true, message: `Updated ${payload.name}` });
        } else {
          await saveCustomer(payload);
          summary.created.Links += 1;
          summary.results.push({ sheet: "Links", row: rowNum, ok: true, message: `Created ${payload.name}` });
        }
      } catch (error) {
        summary.failed.Links += 1;
        summary.results.push({ sheet: "Links", row: rowNum, ok: false, message: errMessage(error) });
      }
    }
  }

  // Engineers
  const engSheet = pickSheet(map, ["Engineers", "Engineer", "FE"]);
  if (engSheet) {
    const objects = sheetRowsToObjects(engSheet.headers, engSheet.rows);
    for (let i = 0; i < objects.length; i++) {
      const rowNum = engSheet.startRow + i;
      const obj = objects[i];
      try {
        const payload = engineerSchema.parse({
          name: cell(obj, "Name"),
          mobile: cell(obj, "Mobile", "WhatsApp", "Phone"),
          empId: cell(obj, "Emp ID", "Employee ID"),
          post: cell(obj, "Post"),
          department: cell(obj, "Department"),
          joiningDate: cell(obj, "Joining Date"),
          status: cell(obj, "Status") || "Active",
          area: cell(obj, "Area / City", "Area", "City"),
          password: cell(obj, "Password") || undefined,
        });
        const byMobile = await findEngineerByMobile(payload.mobile);
        if (byMobile) {
          await saveEngineer(payload, String(byMobile._id));
          summary.updated.Engineers += 1;
          summary.results.push({ sheet: "Engineers", row: rowNum, ok: true, message: `Updated ${payload.name}` });
        } else {
          await saveEngineer(payload);
          summary.created.Engineers += 1;
          summary.results.push({ sheet: "Engineers", row: rowNum, ok: true, message: `Created ${payload.name}` });
        }
      } catch (error) {
        summary.failed.Engineers += 1;
        summary.results.push({ sheet: "Engineers", row: rowNum, ok: false, message: errMessage(error) });
      }
    }
  }

  // Tickets
  const ticketSheet = pickSheet(map, ["Tickets", "Ticket"]);
  if (ticketSheet) {
    const objects = sheetRowsToObjects(ticketSheet.headers, ticketSheet.rows);
    for (let i = 0; i < objects.length; i++) {
      const rowNum = ticketSheet.startRow + i;
      const obj = objects[i];
      try {
        const linkId = cell(obj, "Link ID", "LinkId");
        const customerName = cell(obj, "Customer Name", "Customer");
        const customer =
          (linkId ? await Customer.findOne({ linkId }) : null) ||
          (customerName
            ? await Customer.findOne({ name: new RegExp(`^${escapeRegex(customerName)}$`, "i") })
            : null);

        if (!customer) {
          throw new Error(
            linkId || customerName
              ? `Link not found (Link ID / Customer Name: ${linkId || customerName})`
              : "Link ID or Customer Name is required"
          );
        }

        const eng1Mobile = cell(obj, "Eng1 Mobile", "Engineer 1 Mobile", "FE1 Mobile");
        const eng2Mobile = cell(obj, "Eng2 Mobile", "Engineer 2 Mobile", "FE2 Mobile");
        const eng1 = eng1Mobile ? await findEngineerByMobile(eng1Mobile) : null;
        const eng2 = eng2Mobile ? await findEngineerByMobile(eng2Mobile) : null;

        if (eng1Mobile && !eng1) throw new Error(`Engineer not found for Eng1 Mobile: ${eng1Mobile}`);
        if (eng2Mobile && !eng2) throw new Error(`Engineer not found for Eng2 Mobile: ${eng2Mobile}`);

        const tktNo = cell(obj, "Ticket No", "TKT", "Ticket Number", "Company TKT");
        let status = cell(obj, "Status") || "Open";
        if ((eng1 || eng2) && status === "Open") status = "Assigned";

        const payload = ticketSchema.parse({
          tktNo,
          customerId: String(customer._id),
          ticketType: cell(obj, "Ticket Type", "Type") || "Support",
          priority: cell(obj, "Priority") || "Medium",
          status,
          eng1Id: eng1 ? String(eng1._id) : undefined,
          eng2Id: eng2 ? String(eng2._id) : undefined,
          openTime: cell(obj, "Open Time"),
          closeTime: cell(obj, "Close Time"),
          aEnd: cell(obj, "A-End", "A End") || customer.aEnd || "",
          bEnd: cell(obj, "B-End", "B End") || customer.bEnd || "",
          slaHours: cell(obj, "SLA Hours") || customer.slaHours || 4,
          opticalStatus: cell(obj, "Optical Status") || "Pending",
          affectedPath: cell(obj, "Affected Path", "Path") || customer.pathName || "Main Path",
          resolution: cell(obj, "Resolution"),
          remarks: cell(obj, "Remarks"),
        });

        const existing = await Ticket.findOne({ tktNo: payload.tktNo });
        if (existing) {
          await saveTicket(payload, String(existing._id));
          summary.updated.Tickets += 1;
          summary.results.push({ sheet: "Tickets", row: rowNum, ok: true, message: `Updated ${payload.tktNo}` });
        } else {
          await saveTicket(payload);
          summary.created.Tickets += 1;
          summary.results.push({ sheet: "Tickets", row: rowNum, ok: true, message: `Created ${payload.tktNo}` });
        }
      } catch (error) {
        summary.failed.Tickets += 1;
        summary.results.push({ sheet: "Tickets", row: rowNum, ok: false, message: errMessage(error) });
      }
    }
  }

  return summary;
}
