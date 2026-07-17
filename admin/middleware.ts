import { NextResponse, NextRequest } from "next/server"

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|public/).*)"],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  const token = req.cookies.get("next-auth.session-token")?.value
    || req.cookies.get("__Secure-next-auth.session-token")?.value

  if (!token) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
