"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { getStoreForSession } from "./getStore"

export async function getMenuItems() {
  const store = await getStoreForSession()
  return prisma.menuItem.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } })
}

export async function createMenuItem(data: { name: string; price: number; category: string; description?: string; modifierGroupIds?: string[]; imageUrl?: string }) {
  const store = await getStoreForSession()

  const item = await prisma.menuItem.create({
    data: {
      storeId: store.id,
      name: data.name,
      price: data.price,
      category: data.category,
      description: data.description,
      imageUrl: data.imageUrl || null,
      isAvailable: true,
      modifierGroups: data.modifierGroupIds?.length
        ? { create: data.modifierGroupIds.map((id, i) => ({ modifierGroupId: id, sortOrder: i })) }
        : undefined,
    },
  })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return item
}

export async function updateMenuItem(id: string, data: { name?: string; price?: number; category?: string; isAvailable?: boolean; description?: string; modifierGroupIds?: string[]; imageUrl?: string }) {
  const store = await getStoreForSession()

  const item = await prisma.menuItem.findUnique({ where: { id }, select: { storeId: true } })
  if (!item) throw new Error("Menu item not found")
  if (item.storeId !== store.id) throw new Error("Unauthorized — item does not belong to your store")

  if (data.modifierGroupIds !== undefined) {
    await prisma.menuItemModifierGroup.deleteMany({ where: { menuItemId: id } })
    if (data.modifierGroupIds.length > 0) {
      await prisma.menuItemModifierGroup.createMany({
        data: data.modifierGroupIds.map((gid, i) => ({ menuItemId: id, modifierGroupId: gid, sortOrder: i })),
      })
    }
  }

  const { modifierGroupIds, ...rest } = data
  await prisma.menuItem.update({ where: { id }, data: rest })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return { success: true }
}

export async function deleteMenuItem(id: string) {
  const store = await getStoreForSession()

  const item = await prisma.menuItem.findUnique({ where: { id }, select: { storeId: true } })
  if (!item) throw new Error("Menu item not found")
  if (item.storeId !== store.id) throw new Error("Unauthorized — item does not belong to your store")

  await prisma.menuItem.delete({ where: { id } })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return { success: true }
}

export async function createModifierGroup(data: { name: string; required?: boolean; minSelect?: number; maxSelect?: number; items?: { name: string; price: number }[] }) {
  const store = await getStoreForSession()

  const count = await prisma.modifierGroup.count({ where: { storeId: store.id } })
  const group = await prisma.modifierGroup.create({
    data: {
      storeId: store.id,
      name: data.name,
      required: data.required || false,
      minSelect: data.minSelect || 0,
      maxSelect: data.maxSelect || 1,
      sortOrder: count,
      items: data.items?.length
        ? { create: data.items.map((item, i) => ({ name: item.name, price: item.price, sortOrder: i })) }
        : undefined,
    },
    include: { items: true },
  })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return group
}

export async function updateModifierGroup(id: string, data: { name?: string; required?: boolean; minSelect?: number; maxSelect?: number }) {
  const store = await getStoreForSession()

  const group = await prisma.modifierGroup.findUnique({ where: { id }, select: { storeId: true } })
  if (!group) throw new Error("Modifier group not found")
  if (group.storeId !== store.id) throw new Error("Unauthorized — modifier group does not belong to your store")

  await prisma.modifierGroup.update({ where: { id }, data })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return { success: true }
}

export async function deleteModifierGroup(id: string) {
  const store = await getStoreForSession()

  const group = await prisma.modifierGroup.findUnique({ where: { id }, select: { storeId: true } })
  if (!group) throw new Error("Modifier group not found")
  if (group.storeId !== store.id) throw new Error("Unauthorized — modifier group does not belong to your store")

  await prisma.modifierGroup.delete({ where: { id } })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return { success: true }
}

export async function addModifierToGroup(groupId: string, data: { name: string; price: number; maxQuantity?: number }) {
  const store = await getStoreForSession()

  const group = await prisma.modifierGroup.findUnique({ where: { id: groupId }, select: { storeId: true } })
  if (!group) throw new Error("Modifier group not found")
  if (group.storeId !== store.id) throw new Error("Unauthorized — modifier group does not belong to your store")

  const count = await prisma.modifier.count({ where: { modifierGroupId: groupId } })
  const mod = await prisma.modifier.create({
    data: { modifierGroupId: groupId, name: data.name, price: data.price, sortOrder: count, maxQuantity: data.maxQuantity || 1 },
  })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return mod
}

export async function deleteModifier(id: string) {
  const store = await getStoreForSession()

  const mod = await prisma.modifier.findUnique({ where: { id }, select: { modifierGroup: { select: { storeId: true } } } })
  if (!mod) throw new Error("Modifier not found")
  if (mod.modifierGroup.storeId !== store.id) throw new Error("Unauthorized — modifier does not belong to your store")

  await prisma.modifier.delete({ where: { id } })
  revalidatePath("/menu")
  revalidatePath("/epos")
  return { success: true }
}
