"use server"

import { signIn, signOut, auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"
import bcrypt from "bcryptjs"

export async function login(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}

export async function registerUser(data: {
  name: string
  email: string
  password: string
  storeName: string
}) {
  try {
    if (!data.name || !data.email || !data.password || !data.storeName) {
      return { error: "All fields are required" }
    }
    if (data.password.length < 8) {
      return { error: "Password must be at least 8 characters" }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      return { error: "Email already exists" }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const tenant = await prisma.tenant.create({
      data: {
        name: data.storeName,
        slug: data.storeName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      },
    })

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: "OWNER",
        tenantId: tenant.id,
      },
    })

    await prisma.store.create({
      data: {
        tenantId: tenant.id,
        name: data.storeName,
      },
    })

    return { success: true, tenantId: tenant.id }
  } catch (error) {
    console.error("Register error:", error)
    return { error: "Internal server error" }
  }
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { tenant: true },
  })
  return user
}
