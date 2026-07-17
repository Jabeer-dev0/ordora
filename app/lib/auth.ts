import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      tenantId: string | null
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  interface User {
    role?: string
    tenantId?: string | null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { default: bcrypt } = await import("bcryptjs")
          const { prisma } = await import("@ordora/shared/lib/prisma")
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })
          if (!user) return null

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          if (!isValid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub as string
      session.user.role = token.role as string
      session.user.tenantId = token.tenantId as string | null
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
})
