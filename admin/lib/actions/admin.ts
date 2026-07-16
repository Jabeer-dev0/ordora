"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPlatformStats() {
  const totalTenants = await prisma.tenant.count()
  const totalStores = await prisma.store.count()
  const totalUsers = await prisma.user.count()
  const totalOrders = await prisma.order.count()
  const revenue = await prisma.order.aggregate({ _sum: { total: true }, where: { status: "COMPLETED" } })
  return { totalTenants, totalStores, totalUsers, totalOrders, platformRevenue: Number(revenue._sum.total || 0) }
}

export async function updateTenantStatus(id: string, status: string) {
  await prisma.tenant.update({ where: { id }, data: { status } })
  revalidatePath("/tenants")
  return { success: true }
}

export async function deleteTenant(id: string) {
  await prisma.tenant.delete({ where: { id } })
  revalidatePath("/tenants")
  return { success: true }
}
