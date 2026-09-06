import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/constants";
import { readSessionToken, signSession } from "@/lib/session";
import type { SessionUser } from "@/types";

export function hashPassword(password: string) {
  return hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function requireUser() {
  const user = await getSession();
  if (!user) throw new AppError("Please sign in", 401);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new AppError("Admin access required", 403);
  return user;
}

export async function requireEngineer() {
  const user = await requireUser();
  if (user.role !== "engineer" || !user.engineerId) {
    throw new AppError("Engineer access required", 403);
  }
  return user;
}
