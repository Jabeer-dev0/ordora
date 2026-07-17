"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"

export interface DeliveryZoneInput {
  postcodePattern: string
  label: string
  deliveryFee: number
  minimumOrder: number
  estimatedMins: number
  isActive: boolean
  sortOrder: number
}

export async function getDeliveryZones(storeId: string) {
  return prisma.deliveryZone.findMany({
    where: { storeId },
    orderBy: { sortOrder: "asc" },
  })
}

export async function upsertDeliveryZones(storeId: string, zones: DeliveryZoneInput[]) {
  const existing = await prisma.deliveryZone.findMany({ where: { storeId } })

  for (const zone of zones) {
    const match = existing.find(e => e.postcodePattern === zone.postcodePattern)
    if (match) {
      await prisma.deliveryZone.update({
        where: { id: match.id },
        data: {
          label: zone.label,
          deliveryFee: zone.deliveryFee,
          minimumOrder: zone.minimumOrder,
          estimatedMins: zone.estimatedMins,
          isActive: zone.isActive,
          sortOrder: zone.sortOrder,
        },
      })
    } else {
      await prisma.deliveryZone.create({
        data: {
          storeId,
          postcodePattern: zone.postcodePattern,
          label: zone.label,
          deliveryFee: zone.deliveryFee,
          minimumOrder: zone.minimumOrder,
          estimatedMins: zone.estimatedMins,
          isActive: zone.isActive,
          sortOrder: zone.sortOrder,
        },
      })
    }
  }

  const incomingPatterns = zones.map(z => z.postcodePattern)
  const toDelete = existing.filter(e => !incomingPatterns.includes(e.postcodePattern))
  if (toDelete.length > 0) {
    await prisma.deliveryZone.deleteMany({ where: { id: { in: toDelete.map(e => e.id) } } })
  }

  revalidatePath("/stores")
  return { success: true }
}

export async function deleteDeliveryZone(id: string) {
  try {
    await prisma.deliveryZone.delete({ where: { id } })
    revalidatePath("/stores")
    return { success: true }
  } catch {
    throw new Error("Delivery zone not found or delete failed")
  }
}
