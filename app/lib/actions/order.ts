"use server"

import { prisma } from "@ordora/shared/lib/prisma"
import { revalidatePath } from "next/cache"
import { getStoreForSession } from "./getStore"

export async function getOrders() {
  const store = await getStoreForSession()

  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          menuItem: true,
          modifiers: { include: { modifier: true } },
        },
      },
      user: { select: { name: true } },
    },
  })
  return orders
}

export async function createOrder(data: {
  items: {
    menuItemId: string
    quantity: number
    unitPrice: number
    modifiers?: { modifierId: string; price: number }[]
    notes?: string
  }[]
  source?: string
  notes?: string
  orderType?: string
  paymentMethod?: string
  discount?: number
}) {
  const store = await getStoreForSession()
  const session = await import("@/lib/auth").then(m => m.auth())
  const userId = session?.user?.id || ""

  const subtotal = data.items.reduce((sum, item) => {
    const modTotal = item.modifiers?.reduce((ms, m) => ms + m.price, 0) || 0
    return sum + (item.unitPrice + modTotal) * item.quantity
  }, 0)

  const discountAmount = data.discount || 0
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const tax = afterDiscount * 0.08
  const total = afterDiscount + tax

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      userId,
      source: data.source || "TILL",
      orderType: data.orderType || "DINE_IN",
      paymentMethod: data.paymentMethod || "cash",
      subtotal,
      discount: discountAmount,
      tax,
      total,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: (item.unitPrice + (item.modifiers?.reduce((ms, m) => ms + m.price, 0) || 0)) * item.quantity,
          notes: item.notes,
          modifiers: item.modifiers
            ? {
                create: item.modifiers.map((m) => ({
                  modifierId: m.modifierId,
                  price: m.price,
                })),
              }
            : undefined,
        })),
      },
    },
  })

  revalidatePath("/orders")
  revalidatePath("/epos")
  revalidatePath("/reports")
  revalidatePath("/dashboard")
  return order
}

export async function updateOrderStatus(id: string, status: string) {
  const store = await getStoreForSession()

  const order = await prisma.order.findUnique({ where: { id }, select: { storeId: true } })
  if (!order) throw new Error("Order not found")
  if (order.storeId !== store.id) throw new Error("Unauthorized — order does not belong to your store")

  const updated = await prisma.order.update({ where: { id }, data: { status } })
  revalidatePath("/orders")
  revalidatePath("/dashboard")
  revalidatePath("/reports")
  return updated
}
