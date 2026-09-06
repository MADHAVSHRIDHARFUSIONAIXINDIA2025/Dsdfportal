export const APP_NAME = "DSDF Fiber Ops";
export const COMPANY_LEGAL = "DSDF CONSULTANCY SERVICES PVT LIMITED";

export const ROLES = ["admin", "engineer"] as const;
export type Role = (typeof ROLES)[number];

export const LINK_TYPES = ["Linear", "Link Protection"] as const;
export const PATH_NAMES = ["Main Path", "Protection Path"] as const;
export const FIBER_CORES = ["Single Core", "Dual Core"] as const;
export const CUSTOMER_CATEGORIES = ["FTTH", "Enterprise", "Bank", "Other"] as const;
export const MANAGE_BY = ["Manage By Own", "Vendor"] as const;
export const MASTER_STATUSES = ["Active", "Inactive"] as const;

export const TICKET_TYPES = ["Support", "Implementation"] as const;
export const TICKET_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export const TICKET_STATUSES = [
  "Open",
  "Assigned",
  "In Progress",
  "Pending",
  "Resolved",
  "Closed",
] as const;
export const OPTICAL_STATUSES = ["Pending", "OK", "Not OK"] as const;

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Leave", "Half Day"] as const;

export const MANUAL_LINK_COMPANY = "vodafone idea limited";

export const SESSION_COOKIE = "fom_session";
export const SESSION_DAYS = 12;
