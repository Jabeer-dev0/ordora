"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { getStoreForSession } from "./getStore"

export async function getStaff() {
  const store = await getStoreForSession()

  const staff = await prisma.staff.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  })
  return staff
}

export async function createStaff(data: { name: string; role: string; email?: string; phone?: string }) {
  const store = await getStoreForSession()

  const member = await prisma.staff.create({
    data: { storeId: store.id, ...data, isActive: true },
  })
  revalidatePath("/staff")
  return member
}

export async function updateStaffRole(id: string, role: string) {
  const store = await getStoreForSession()

  const member = await prisma.staff.findUnique({ where: { id }, select: { storeId: true } })
  if (!member) throw new Error("Staff member not found")
  if (member.storeId !== store.id) throw new Error("Unauthorized — staff member does not belong to your store")

  const updated = await prisma.staff.update({ where: { id }, data: { role } })
  revalidatePath("/staff")
  return updated
}

export async function removeStaff(id: string) {
  const store = await getStoreForSession()

  const member = await prisma.staff.findUnique({ where: { id }, select: { storeId: true } })
  if (!member) throw new Error("Staff member not found")
  if (member.storeId !== store.id) throw new Error("Unauthorized — staff member does not belong to your store")

  await prisma.staff.delete({ where: { id } })
  revalidatePath("/staff")
  return { success: true }
}
