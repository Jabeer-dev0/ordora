"use server"

import { prisma } from "@ordora/shared/lib/prisma"

export async function createOnlineOrder(data: {
  storeSlug: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  orderType: string
  notes?: string
  items: {
    menuItemId: string
    name: string
    quantity: number
    unitPrice: number
    modifiers?: { modifierId: string; name: string; price: number }[]
  }[]
  subtotal: number
  deliveryFee: number
  serviceCharge: number
  bagCharge: number
  total: number
  paymentMethod?: string
}) {
  const store = await prisma.store.findUnique({ where: { slug: data.storeSlug } })
  if (!store) throw new Error("Store not found")

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      source: "ONLINE",
      orderType: data.orderType.toUpperCase(),
      paymentMethod: data.paymentMethod || "cash",
      subtotal: data.subtotal,
      discount: 0,
      tax: 0,
      total: data.total,
      notes: [
        data.customerName ? `Customer: ${data.customerName}` : null,
        data.customerPhone ? `Phone: ${data.customerPhone}` : null,
        data.customerAddress ? `Address: ${data.customerAddress}` : null,
        data.notes || null,
      ].filter(Boolean).join(" | "),
      items: {
        create: data.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: (item.unitPrice + (item.modifiers?.reduce((ms, m) => ms + m.price, 0) || 0)) * item.quantity,
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
    include: {
      items: true,
    },
  })

  return { orderId: order.id, total: order.total }
}
