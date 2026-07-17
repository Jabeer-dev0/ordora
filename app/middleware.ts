import NextAuth from "next-auth"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Allow public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|public/).*)"],
}
