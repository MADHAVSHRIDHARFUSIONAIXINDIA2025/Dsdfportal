import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Repeat,
  Settings,
  Ticket,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; short?: string };

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, short: "Home" },
  { href: "/admin/companies", label: "Companies", icon: Building2, short: "Co." },
  { href: "/admin/customers", label: "Customers & Links", icon: MapPin, short: "Links" },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket, short: "Tickets" },
  { href: "/admin/engineers", label: "Engineers", icon: Users, short: "FE" },
  { href: "/admin/bulk-upload", label: "Bulk Upload", icon: Upload, short: "Bulk" },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardList, short: "Attend" },
  { href: "/admin/reports", label: "Reports", icon: Repeat, short: "Reports" },
  { href: "/admin/settings", label: "Settings", icon: Settings, short: "Settings" },
];
export const engineerNav: NavItem[] = [
  { href: "/ext", label: "Home", icon: LayoutDashboard, short: "Home" },
  { href: "/ext/tickets", label: "Tickets", icon: Ticket, short: "Tickets" },
  { href: "/ext/attendance", label: "Attendance", icon: ClipboardList, short: "Attend" },
  { href: "/ext/settings", label: "Settings", icon: Settings, short: "Account" },
];
