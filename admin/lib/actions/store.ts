"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getStores() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { name: true, id: true } },
      _count: { select: { orders: true, menuItems: true, staff: true } },
    },
  })
  return stores
}

export async function getStore(storeId: string) {
  return prisma.store.findUnique({
    where: { id: storeId },
    include: {
      openingHours: { orderBy: { day: "asc" } },
      deliveryZones: { orderBy: { sortOrder: "asc" } },
    },
  })
}

export async function getTenants() {
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  return tenants
}

export async function getStoreStats() {
  const totalStores = await prisma.store.count()
  const activeStores = await prisma.store.count({ where: { isActive: true } })
  return { totalStores, activeStores }
}

export async function createStore(data: {
  name: string
  tenantId: string
  slug?: string
  address?: string
  phone?: string
  postcode?: string
  brandColor?: string
  accentColor?: string
  tagline?: string
  heroImageUrl?: string
  webServiceCharge?: number
  bagCharge?: number
}) {
  if (!data.name || !data.tenantId) throw new Error("Name and tenant are required")

  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const store = await prisma.store.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      slug,
      address: data.address || null,
      phone: data.phone || null,
      postcode: data.postcode || null,
      brandColor: data.brandColor || null,
      accentColor: data.accentColor || null,
      tagline: data.tagline || null,
      heroImageUrl: data.heroImageUrl || null,
      webServiceCharge: data.webServiceCharge || 0,
      bagCharge: data.bagCharge || 0,
      isActive: true,
    },
  })

  revalidatePath("/stores")
  revalidatePath("/dashboard")
  return store
}

export async function updateStore(id: string, data: {
  name?: string
  slug?: string
  address?: string | null
  phone?: string | null
  postcode?: string | null
  description?: string | null
  website?: string | null
  brandColor?: string | null
  accentColor?: string | null
  tagline?: string | null
  heroImageUrl?: string | null
  webServiceCharge?: number
  bagCharge?: number
  deliveryEnabled?: boolean
  collectionEnabled?: boolean
  minimumOrderAmount?: number
  deliveryFee?: number
  estimatedPrepTime?: number
  acceptingOrders?: boolean
  isActive?: boolean
}) {
  await prisma.store.update({ where: { id }, data })
  revalidatePath("/stores")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteStore(id: string) {
  await prisma.store.delete({ where: { id } })
  revalidatePath("/stores")
  revalidatePath("/dashboard")
  return { success: true }
}
