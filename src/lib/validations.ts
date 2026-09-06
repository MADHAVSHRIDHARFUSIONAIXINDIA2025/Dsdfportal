import { z } from "zod";
import {
  ATTENDANCE_STATUSES,
  CUSTOMER_CATEGORIES,
  FIBER_CORES,
  LINK_TYPES,
  MANAGE_BY,
  MASTER_STATUSES,
  OPTICAL_STATUSES,
  PATH_NAMES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
} from "@/lib/constants";

const emptyToUndef = (value: unknown) => (value === "" || value === null ? undefined : value);

export const loginSchema = z.object({
  identifier: z.string().min(3, "Email or mobile is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const setupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  status: z.enum(MASTER_STATUSES).default("Active"),
  remarks: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  companyId: z.string().min(1, "Company is required"),
  linkId: z.string().optional(),
  city: z.string().min(2, "City is required"),
  linkType: z.enum(LINK_TYPES).default("Linear"),
  pathName: z.enum(PATH_NAMES).default("Main Path"),
  fiberCore: z.enum(FIBER_CORES).default("Single Core"),
  customerCategory: z.enum(CUSTOMER_CATEGORIES).default("Enterprise"),
  manageBy: z.enum(MANAGE_BY).default("Manage By Own"),
  vendorName: z.string().optional(),
  vendorContact: z.string().optional(),
  serviceType: z.string().optional(),
  bandwidth: z.string().optional(),
  aEnd: z.string().optional(),
  bEnd: z.string().optional(),
  aEndLatitude: z.string().optional(),
  aEndLongitude: z.string().optional(),
  bEndLatitude: z.string().optional(),
  bEndLongitude: z.string().optional(),
  implementationDate: z.string().optional(),
  contact: z.string().optional(),
  slaHours: z.coerce.number().min(0).default(4),
  status: z.enum(MASTER_STATUSES).default("Active"),
  remarks: z.string().optional(),
});

export const engineerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  empId: z.string().optional(),
  post: z.string().optional(),
  department: z.string().optional(),
  mobile: z.string().min(10, "Mobile is required"),
  joiningDate: z.string().optional(),
  status: z.enum(MASTER_STATUSES).default("Active"),
  area: z.string().optional(),
  password: z.preprocess(emptyToUndef, z.string().min(8, "Password must be at least 8 characters").optional()),
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  password: z.string().min(8, "New password must be at least 8 characters"),
});

export const ticketSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  tktNo: z.string().min(1, "Company ticket number is required"),
  ticketType: z.enum(TICKET_TYPES).default("Support"),
  openTime: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES).default("Medium"),
  status: z.enum(TICKET_STATUSES).default("Open"),
  eng1Id: z.preprocess(emptyToUndef, z.string().optional()),
  eng2Id: z.preprocess(emptyToUndef, z.string().optional()),
  closeTime: z.string().optional(),
  resolution: z.string().optional(),
  remarks: z.string().optional(),
  slaHours: z.coerce.number().min(0).optional(),
  aEnd: z.string().optional(),
  bEnd: z.string().optional(),
  aOpticalPower: z.string().optional(),
  bOpticalPower: z.string().optional(),
  opticalStatus: z.enum(OPTICAL_STATUSES).default("Pending"),
  affectedPath: z.enum(PATH_NAMES).optional(),
});

export const attendanceSchema = z.object({
  engineerId: z.string().min(1, "Engineer is required"),
  attDate: z.string().min(1, "Date is required"),
  inTime: z.string().optional(),
  outTime: z.string().optional(),
  status: z.enum(ATTENDANCE_STATUSES),
  remarks: z.string().optional(),
});

export const onboardSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobile: z.string().min(10, "WhatsApp mobile is required"),
});
