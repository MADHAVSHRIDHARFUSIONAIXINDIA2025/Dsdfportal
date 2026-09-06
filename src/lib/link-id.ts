import { MANUAL_LINK_COMPANY } from "@/lib/constants";

export function shouldAutoLinkId(companyName?: string | null) {
  return (companyName || "").trim().toLowerCase() !== MANUAL_LINK_COMPANY;
}

export function buildLinkId(input: {
  companyName: string;
  city?: string | null;
  pathName?: string | null;
  seq: number;
}) {
  const code = (input.companyName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 5) || "COMP");
  const city = ((input.city || "CITY").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 4) || "CITY");
  const path = (input.pathName || "Main Path") === "Protection Path" ? "P" : "M";
  return `DSDF-${code}-${city}-${path}-${String(input.seq).padStart(5, "0")}`;
}
