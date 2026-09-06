import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { readSessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    if (user.role !== "admin") return NextResponse.redirect(new URL("/ext", request.url));
  }

  const engineerPublic = pathname.startsWith("/ext/login") || pathname.startsWith("/ext/onboard");
  if (pathname.startsWith("/ext") && !engineerPublic) {
    if (!user) return NextResponse.redirect(new URL("/ext/login", request.url));
    if (user.role !== "engineer") return NextResponse.redirect(new URL("/admin", request.url));
  }

  if ((pathname === "/login" || pathname === "/ext/login") && user) {
    return NextResponse.redirect(new URL(user.role === "admin" ? "/admin" : "/ext", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/ext/:path*", "/login"],
};
