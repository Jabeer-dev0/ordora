"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { getStoreForSession } from "./getStore"

export async function updateStoreSettings(data: { name?: string; phone?: string; address?: string }) {
  const store = await getStoreForSession()
  await prisma.store.update({ where: { id: store.id }, data })
  revalidatePath("/settings")
  return { success: true }
}
