"use server"

import Stripe from "stripe"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === "sk_test_placeholder") return null
  return new Stripe(key)
}

export async function createCheckoutSession(data: {
  storeName: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  orderType: string
  items: { name: string; quantity: number; unitPrice: number; modifiers?: { name: string; price: number }[] }[]
  subtotal: number
  serviceCharge: number
  bagCharge: number
  deliveryFee: number
  total: number
  successUrl: string
  cancelUrl: string
}) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.")

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = data.items.map(item => ({
    price_data: {
      currency: "gbp",
      product_data: {
        name: item.name + (item.modifiers?.length ? ` (${item.modifiers.map(m => m.name).join(", ")})` : ""),
      },
      unit_amount: Math.round((item.unitPrice + (item.modifiers?.reduce((s, m) => s + m.price, 0) || 0)) * 100),
    },
    quantity: item.quantity,
  }))

  if (data.serviceCharge > 0) {
    lineItems.push({
      price_data: { currency: "gbp", product_data: { name: "Service charge" }, unit_amount: Math.round(data.serviceCharge * 100) },
      quantity: 1,
    })
  }
  if (data.bagCharge > 0) {
    lineItems.push({
      price_data: { currency: "gbp", product_data: { name: "Bag charge" }, unit_amount: Math.round(data.bagCharge * 100) },
      quantity: 1,
    })
  }
  if (data.deliveryFee > 0) {
    lineItems.push({
      price_data: { currency: "gbp", product_data: { name: "Delivery fee" }, unit_amount: Math.round(data.deliveryFee * 100) },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    metadata: {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress || "",
      orderType: data.orderType,
      storeName: data.storeName,
    },
    success_url: data.successUrl + "?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: data.cancelUrl,
  })

  return { sessionId: session.id, url: session.url }
}

export async function verifyCheckoutSession(sessionId: string) {
  const stripe = getStripe()
  if (!stripe) return { success: false, metadata: null, amount: 0 }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return { 
      success: session.payment_status === "paid", 
      metadata: session.metadata,
      amount: session.amount_total ? session.amount_total / 100 : 0,
    }
  } catch {
    return { success: false, metadata: null, amount: 0 }
  }
}
