import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function nowLabel(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
}

export function fromDatetimeLocal(value?: string | null) {
  if (!value) return "";
  return value.replace("T", " ");
}

export function normalizePhone(mobile?: string | null) {
  const digits = (mobile || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function displayPhone(mobile?: string | null) {
  const digits = (mobile || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return mobile || "—";
}

export function initials(name?: string | null) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function monthKey(value?: string | null) {
  const raw = (value || "").slice(0, 7);
  return /^\d{4}-\d{2}$/.test(raw) ? raw : "";
}

export function formatMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}
