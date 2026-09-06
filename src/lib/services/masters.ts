import { AppError } from "@/lib/errors";
import { Company, Customer } from "@/models";
import { mapCompany } from "@/lib/services/mappers";
import type { z } from "zod";
import type { companySchema } from "@/lib/validations";

export async function listCompanies() {
  const rows = await Company.find().sort({ name: 1 }).lean();
  return rows.map((row) => mapCompany(row as Record<string, unknown>));
}

export async function saveCompany(input: z.infer<typeof companySchema>, id?: string) {
  const doc = id
    ? await Company.findByIdAndUpdate(id, input, { new: true, runValidators: true })
    : await Company.create(input);
  if (!doc) throw new AppError("Company not found", 404);
  return mapCompany(doc.toObject());
}

export async function deleteCompany(id: string) {
  const used = await Customer.exists({ companyId: id });
  if (used) throw new AppError("Company cannot be deleted because customer/link records use it");
  await Company.findByIdAndDelete(id);
}
