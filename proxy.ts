import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const GUEST_ONLY_PATHS = ["/login", "/signup"]
const ALWAYS_PUBLIC_PATHS = ["/"]

export function proxy(request: NextRequest) {
  const token = request.cookies.get("session_token")
  const { pathname } = request.nextUrl

  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p))
  const isAlwaysPublic = ALWAYS_PUBLIC_PATHS.includes(pathname)

  if (token && isGuestOnly) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!token && !isGuestOnly && !isAlwaysPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
}
