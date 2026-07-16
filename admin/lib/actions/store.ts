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
  address?: string
  phone?: string
}) {
  if (!data.name || !data.tenantId) throw new Error("Name and tenant are required")

  const store = await prisma.store.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      address: data.address || null,
      phone: data.phone || null,
      isActive: true,
    },
  })

  revalidatePath("/stores")
  revalidatePath("/dashboard")
  return store
}

export async function updateStore(id: string, data: { name?: string; address?: string; phone?: string; isActive?: boolean }) {
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
