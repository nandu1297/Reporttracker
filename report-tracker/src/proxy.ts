import { NextRequest, NextResponse } from "next/server";
import { authToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  if (!process.env.APP_PASSWORD) return NextResponse.next();
  if (req.nextUrl.pathname === "/login") return NextResponse.next();
  if (req.cookies.get("rt_auth")?.value === (await authToken())) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
