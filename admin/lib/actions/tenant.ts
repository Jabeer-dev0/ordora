"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { stores: true, users: true } } },
    })
    return tenants
  } catch (error) {
    console.error("getTenants error:", error)
    throw new Error("Failed to fetch tenants")
  }
}

export async function getTenantStats() {
  try {
    const totalTenants = await prisma.tenant.count()
    const activeTenants = await prisma.tenant.count({ where: { status: "ACTIVE" } })
    return { totalTenants, activeTenants }
  } catch (error) {
    console.error("getTenantStats error:", error)
    throw new Error("Failed to fetch tenant stats")
  }
}

export async function createTenant(data: {
  name: string
  ownerName: string
  ownerEmail: string
  ownerPassword: string
  storeName: string
  plan?: string
  logoUrl?: string
  brandColor?: string
  accentColor?: string
  tagline?: string
}) {
  try {
    if (!data.name || !data.ownerEmail || !data.ownerPassword || !data.storeName) {
      throw new Error("All fields are required")
    }

    const existing = await prisma.user.findUnique({ where: { email: data.ownerEmail } })
    if (existing) throw new Error("Email already exists")

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    let storeSlug = data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    const existingSlug = await prisma.store.findUnique({ where: { slug: storeSlug } })
    if (existingSlug) {
      storeSlug = `${storeSlug}-${Date.now()}`
    }

    const hashedPassword = await bcrypt.hash(data.ownerPassword, 12)

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug,
          logoUrl: data.logoUrl || null,
          plan: data.plan || "FREE",
          status: "ACTIVE",
        },
      })

      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: data.storeName,
          slug: storeSlug,
          brandColor: data.brandColor || null,
          accentColor: data.accentColor || null,
          tagline: data.tagline || null,
        },
      })

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.ownerEmail,
          name: data.ownerName,
          password: hashedPassword,
          role: "OWNER",
        },
      })

      await tx.subscription.create({
        data: { tenantId: tenant.id, plan: data.plan || "FREE", status: "active" },
      })

      return { tenant, store }
    })

    revalidatePath("/tenants")
    revalidatePath("/stores")
    revalidatePath("/dashboard")
    return result
  } catch (error) {
    console.error("createTenant error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create tenant")
  }
}

export async function updateTenant(id: string, data: {
  name?: string
  logoUrl?: string | null
  brandColor?: string | null
  accentColor?: string | null
  tagline?: string | null
  plan?: string
  status?: string
}) {
  try {
    await prisma.tenant.update({ where: { id }, data })
    revalidatePath("/tenants")
    revalidatePath("/stores")
    return { success: true }
  } catch {
    throw new Error("Tenant not found or update failed")
  }
}

export async function updateTenantStatus(id: string, status: string) {
  try {
    await prisma.tenant.update({ where: { id }, data: { status } })
    revalidatePath("/tenants")
    return { success: true }
  } catch {
    throw new Error("Tenant not found or update failed")
  }
}

export async function deleteTenant(id: string) {
  try {
    await prisma.tenant.delete({ where: { id } })
    revalidatePath("/tenants")
    revalidatePath("/stores")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    throw new Error("Tenant not found or delete failed")
  }
}
