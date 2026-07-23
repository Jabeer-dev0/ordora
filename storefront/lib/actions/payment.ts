// Card payments are processed per-shop via Stripe Connect on the Ordora backend.
// The storefront calls the backend's public checkout endpoint. For now, if Stripe
// is not connected for the shop, the backend returns a clear error which the UI surfaces.
import { API_BASE } from "@/lib/api"

export async function createCheckoutSession(data: {
  storeSlug: string
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
  const res = await fetch(`${API_BASE}/api/storefront/${data.storeSlug}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Card checkout is not available for this shop yet.")
  }
  return res.json()
}

export async function verifyCheckoutSession(_sessionId: string) {
  return { success: false, metadata: null, amount: 0 }
}
