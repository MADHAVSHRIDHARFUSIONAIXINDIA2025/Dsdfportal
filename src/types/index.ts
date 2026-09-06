import type { Role } from "@/lib/constants";

export type SessionUser = {
  id: string;
  name: string;
  role: Role;
  email?: string;
  mobile?: string;
  engineerId?: string;
};

export type ApiError = {
  error: string;
};

export type DashboardStats = {
  customers: number;
  links: number;
  open: number;
  closed: number;
  breached: number;
  engineers: number;
};

export type TicketFlowBucket = {
  month: string;
  label: string;
  implementation: number;
  support: number;
};

export type RepeatLinkRow = {
  month: string;
  linkId: string;
  customer: string;
  city: string;
  repeatCount: number;
  totalTickets: number;
  firstOpen: string;
  lastRepeatOpen: string;
  ticketNos: string;
};
