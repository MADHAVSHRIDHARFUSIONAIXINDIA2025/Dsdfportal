import { AppError } from "@/lib/errors";
import { buildLinkId, shouldAutoLinkId } from "@/lib/link-id";
import { Company, Customer } from "@/models";
import { mapCustomer } from "@/lib/services/mappers";
import type { z } from "zod";
import type { customerSchema } from "@/lib/validations";

type CustomerInput = z.infer<typeof customerSchema>;

async function applyCompanySnapshot(input: CustomerInput) {
  const company = await Company.findById(input.companyId);
  if (!company) throw new AppError("Selected company was not found");

  const manageBy = input.manageBy || "Manage By Own";
  if (manageBy === "Vendor" && !input.vendorName) {
    throw new AppError("Vendor name is required when Manage By is Vendor");
  }

  let linkId = (input.linkId || "").trim();
  if (shouldAutoLinkId(company.name)) {
    if (!linkId) {
      const seq = (await Customer.countDocuments()) + 1;
      linkId = buildLinkId({
        companyName: company.name,
        city: input.city,
        pathName: input.pathName,
        seq,
      });
    }
  } else if (!linkId) {
    throw new AppError("Link ID is required for Vodafone Idea Limited");
  }

  return {
    ...input,
    linkId,
    pathName: input.linkType === "Linear" ? "Main Path" : input.pathName || "Main Path",
    vendorName: manageBy === "Manage By Own" ? "" : input.vendorName,
    vendorContact: manageBy === "Manage By Own" ? "" : input.vendorContact,
    companyName: company.name,
    companyContact: company.contact,
    companyEmail: company.email,
    companyAddress: company.address,
  };
}

export async function listCustomers() {
  const rows = await Customer.find().populate("companyId").sort({ name: 1 }).lean();
  return rows.map((row) => mapCustomer(row as Record<string, unknown>));
}

export async function saveCustomer(input: CustomerInput, id?: string) {
  const payload = await applyCompanySnapshot(input);
  const doc = id
    ? await Customer.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
    : await Customer.create(payload);
  if (!doc) throw new AppError("Customer not found", 404);
  const full = await Customer.findById(doc._id).populate("companyId").lean();
  return mapCustomer(full as Record<string, unknown>);
}

export async function deleteCustomer(id: string) {
  const { Ticket } = await import("@/models");
  const used = await Ticket.exists({ customerId: id });
  if (used) throw new AppError("Customer cannot be deleted because tickets exist");
  await Customer.findByIdAndDelete(id);
}
