import { computeSla } from "@/lib/sla";

function idOf(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function nameOf(value: unknown) {
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: string }).name || "");
  }
  return "";
}

export function mapCompany(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    name: doc.name,
    contact: doc.contact || "",
    email: doc.email || "",
    address: doc.address || "",
    status: doc.status || "Active",
    remarks: doc.remarks || "",
  };
}

export function mapCustomer(doc: Record<string, unknown>) {
  const company = doc.companyId && typeof doc.companyId === "object" ? (doc.companyId as Record<string, unknown>) : null;
  return {
    id: String(doc._id),
    name: doc.name,
    companyId: idOf(doc.companyId),
    companyName: company?.name || doc.companyName || "",
    companyContact: company?.contact || doc.companyContact || "",
    companyEmail: company?.email || doc.companyEmail || "",
    companyAddress: company?.address || doc.companyAddress || "",
    linkId: doc.linkId || "",
    city: doc.city || "",
    linkType: doc.linkType || "Linear",
    pathName: doc.pathName || "Main Path",
    fiberCore: doc.fiberCore || "Single Core",
    customerCategory: doc.customerCategory || "Enterprise",
    manageBy: doc.manageBy || "Manage By Own",
    vendorName: doc.vendorName || "",
    vendorContact: doc.vendorContact || "",
    serviceType: doc.serviceType || "",
    bandwidth: doc.bandwidth || "",
    aEnd: doc.aEnd || "",
    bEnd: doc.bEnd || "",
    aEndLatitude: doc.aEndLatitude || "",
    aEndLongitude: doc.aEndLongitude || "",
    bEndLatitude: doc.bEndLatitude || "",
    bEndLongitude: doc.bEndLongitude || "",
    implementationDate: doc.implementationDate || "",
    contact: doc.contact || "",
    slaHours: doc.slaHours || 4,
    status: doc.status || "Active",
    remarks: doc.remarks || "",
    kmlFileUrl: doc.kmlFileUrl || "",
  };
}

export function mapEngineer(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    name: doc.name,
    empId: doc.empId || "",
    post: doc.post || "",
    department: doc.department || "",
    mobile: doc.mobile || "",
    joiningDate: doc.joiningDate || "",
    status: doc.status || "Active",
    area: doc.area || "",
    onboardStatus: doc.onboardStatus || "invited",
    userId: idOf(doc.userId) || "",
  };
}

export function mapTicket(doc: Record<string, unknown>) {
  const customer = doc.customerId && typeof doc.customerId === "object" ? (doc.customerId as Record<string, unknown>) : null;
  const sla = computeSla(String(doc.openTime || ""), String(doc.closeTime || ""), Number(doc.slaHours || 0));
  return {
    id: String(doc._id),
    customerId: idOf(doc.customerId),
    customer: nameOf(doc.customerId),
    companyName: customer?.companyName || "",
    linkId: customer?.linkId || "",
    city: customer?.city || "",
    linkType: customer?.linkType || "",
    pathName: customer?.pathName || "",
    fiberCore: customer?.fiberCore || "",
    customerCategory: customer?.customerCategory || "",
    tktNo: doc.tktNo,
    openTime: doc.openTime || "",
    priority: doc.priority || "Medium",
    status: doc.status || "Open",
    eng1Id: idOf(doc.eng1Id) || "",
    eng2Id: idOf(doc.eng2Id) || "",
    eng1: nameOf(doc.eng1Id),
    eng2: nameOf(doc.eng2Id),
    closeTime: doc.closeTime || "",
    resolution: doc.resolution || "",
    remarks: doc.remarks || "",
    slaHours: doc.slaHours || 4,
    ticketType: doc.ticketType || "Support",
    aEnd: doc.aEnd || "",
    bEnd: doc.bEnd || "",
    aOpticalPower: doc.aOpticalPower || "",
    bOpticalPower: doc.bOpticalPower || "",
    opticalStatus: doc.opticalStatus || "Pending",
    affectedPath: doc.affectedPath || "Main Path",
    duration: sla.duration,
    slaResult: sla.slaResult,
    whatsapp: doc.whatsapp || {},
    whatsappStatus: whatsappLabel(doc.whatsapp),
    attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
  };
}

function whatsappLabel(value: unknown) {
  const row = value && typeof value === "object" ? (value as { eng1?: { status?: string; error?: string }; eng2?: { status?: string; error?: string } }) : {};
  const entries = [row.eng1, row.eng2].filter(Boolean) as Array<{ status?: string; error?: string }>;
  if (entries.some((e) => e.status === "sent" && e.error === "push")) return "Push sent";
  if (entries.some((e) => e.status === "sent")) return "WA sent";
  if (entries.some((e) => e.status === "dry-run")) return "Alert pending";
  if (entries.some((e) => e.status === "failed")) return "Alert failed";
  if (entries.some((e) => e.status === "skipped")) return "Alert skipped";
  return "";
}

export function mapAttendance(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    engineerId: idOf(doc.engineerId),
    engineer: nameOf(doc.engineerId),
    attDate: doc.attDate,
    inTime: doc.inTime || "",
    outTime: doc.outTime || "",
    status: doc.status,
    remarks: doc.remarks || "",
  };
}
