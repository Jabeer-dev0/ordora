"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getStores() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { name: true, id: true } },
        _count: { select: { orders: true, menuItems: true, staff: true } },
      },
    })
    return stores
  } catch (error) {
    console.error("getStores error:", error)
    throw new Error("Failed to fetch stores")
  }
}

export async function getStore(storeId: string) {
  try {
    return prisma.store.findUnique({
      where: { id: storeId },
      include: {
        openingHours: { orderBy: { day: "asc" } },
        deliveryZones: { orderBy: { sortOrder: "asc" } },
      },
    })
  } catch (error) {
    console.error("getStore error:", error)
    throw new Error("Failed to fetch store")
  }
}

export async function getTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
    return tenants
  } catch (error) {
    console.error("getTenants error:", error)
    throw new Error("Failed to fetch tenants")
  }
}

export async function getStoreStats() {
  try {
    const totalStores = await prisma.store.count()
    const activeStores = await prisma.store.count({ where: { isActive: true } })
    return { totalStores, activeStores }
  } catch (error) {
    console.error("getStoreStats error:", error)
    throw new Error("Failed to fetch store stats")
  }
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
  try {
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
  } catch (error) {
    console.error("createStore error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create store")
  }
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
  try {
    await prisma.store.update({ where: { id }, data })
    revalidatePath("/stores")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("updateStore error:", error)
    throw new Error("Store not found or update failed")
  }
}

export async function deleteStore(id: string) {
  try {
    await prisma.store.delete({ where: { id } })
    revalidatePath("/stores")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("deleteStore error:", error)
    throw new Error("Store not found or delete failed")
  }
}
