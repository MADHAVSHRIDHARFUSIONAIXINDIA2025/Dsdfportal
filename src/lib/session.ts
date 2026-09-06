import { SignJWT, jwtVerify } from "jose";
import { SESSION_COOKIE, SESSION_DAYS, type Role } from "@/lib/constants";
import type { SessionUser } from "@/types";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function readSessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.sub || payload.id),
      name: String(payload.name || ""),
      role: payload.role as Role,
      email: payload.email ? String(payload.email) : undefined,
      mobile: payload.mobile ? String(payload.mobile) : undefined,
      engineerId: payload.engineerId ? String(payload.engineerId) : undefined,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
