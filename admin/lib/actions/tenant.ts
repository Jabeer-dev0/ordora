"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { stores: true, users: true } } },
  })
  return tenants
}

export async function getTenantStats() {
  const totalTenants = await prisma.tenant.count()
  const activeTenants = await prisma.tenant.count({ where: { status: "ACTIVE" } })
  return { totalTenants, activeTenants }
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
  if (!data.name || !data.ownerEmail || !data.ownerPassword || !data.storeName) {
    throw new Error("All fields are required")
  }

  const existing = await prisma.user.findUnique({ where: { email: data.ownerEmail } })
  if (existing) throw new Error("Email already exists")

  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const storeSlug = data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const hashedPassword = await bcrypt.hash(data.ownerPassword, 12)

  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      slug,
      logoUrl: data.logoUrl || null,
      plan: data.plan || "FREE",
      status: "ACTIVE",
    },
  })

  const store = await prisma.store.create({
    data: {
      tenantId: tenant.id,
      name: data.storeName,
      slug: storeSlug,
      brandColor: data.brandColor || null,
      accentColor: data.accentColor || null,
      tagline: data.tagline || null,
    },
  })

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: data.ownerEmail,
      name: data.ownerName,
      password: hashedPassword,
      role: "OWNER",
    },
  })

  await prisma.subscription.create({
    data: { tenantId: tenant.id, plan: data.plan || "FREE", status: "active" },
  })

  revalidatePath("/tenants")
  revalidatePath("/stores")
  revalidatePath("/dashboard")
  return { tenant, store }
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
  await prisma.tenant.update({ where: { id }, data })
  revalidatePath("/tenants")
  revalidatePath("/stores")
  return { success: true }
}

export async function updateTenantStatus(id: string, status: string) {
  await prisma.tenant.update({ where: { id }, data: { status } })
  revalidatePath("/tenants")
  return { success: true }
}

export async function deleteTenant(id: string) {
  await prisma.tenant.delete({ where: { id } })
  revalidatePath("/tenants")
  revalidatePath("/stores")
  revalidatePath("/dashboard")
  return { success: true }
}
