"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"

export interface OpeningHourInput {
  day: number
  open: string
  close: string
  isActive: boolean
}

export async function getOpeningHours(storeId: string) {
  try {
    const hours = await prisma.storeOpeningHour.findMany({
      where: { storeId },
      orderBy: { day: "asc" },
    })
    return hours
  } catch (error) {
    console.error("getOpeningHours error:", error)
    throw new Error("Failed to fetch opening hours")
  }
}

export async function upsertOpeningHours(storeId: string, hours: OpeningHourInput[]) {
  try {
    for (const h of hours) {
      await prisma.storeOpeningHour.upsert({
        where: { storeId_orderType_day: { storeId, orderType: "STORE", day: h.day } },
        update: { open: h.open, close: h.close, isActive: h.isActive },
        create: { storeId, orderType: "STORE", day: h.day, open: h.open, close: h.close, isActive: h.isActive },
      })
    }
    revalidatePath("/stores")
    return { success: true }
  } catch (error) {
    console.error("upsertOpeningHours error:", error)
    throw new Error("Failed to update opening hours")
  }
}

export async function initializeOpeningHours(storeId: string) {
  try {
    const existing = await prisma.storeOpeningHour.count({ where: { storeId } })
    if (existing > 0) return { success: true }

    const defaultHours: OpeningHourInput[] = [
      { day: 0, open: "09:00", close: "22:00", isActive: false },
      { day: 1, open: "09:00", close: "22:00", isActive: true },
      { day: 2, open: "09:00", close: "22:00", isActive: true },
      { day: 3, open: "09:00", close: "22:00", isActive: true },
      { day: 4, open: "09:00", close: "22:00", isActive: true },
      { day: 5, open: "09:00", close: "22:00", isActive: true },
      { day: 6, open: "09:00", close: "22:00", isActive: true },
    ]
    await upsertOpeningHours(storeId, defaultHours)
    return { success: true }
  } catch (error) {
    console.error("initializeOpeningHours error:", error)
    throw new Error("Failed to initialize opening hours")
  }
}
