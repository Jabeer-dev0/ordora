import { storefrontApi } from "@/lib/api"

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
  const res = await storefrontApi.createOrder({
    storeSlug: data.storeSlug,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    orderType: data.orderType,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    subtotal: data.subtotal,
    deliveryFee: data.deliveryFee,
    serviceCharge: data.serviceCharge,
    bagCharge: data.bagCharge,
    total: data.total,
    items: data.items.map((i) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: (i.unitPrice + (i.modifiers?.reduce((ms, m) => ms + m.price, 0) || 0)) * i.quantity,
      modifiers: i.modifiers,
    })),
  })
  return res
}
