export interface OpeningHour {
  day: number
  open: string
  close: string
  isActive: boolean
  orderType?: string
}

export interface StoreOpenStatus {
  isOpen: boolean
  text: string
  until: string
}

export function getStoreOpenStatus(
  store: { acceptingOrders: boolean; closedUntil?: Date | string | null },
  hours: OpeningHour[],
  orderType?: string
): StoreOpenStatus {
  if (!store.acceptingOrders) {
    return { isOpen: false, text: "Currently closed", until: "" }
  }

  if (store.closedUntil) {
    const closedUntilDate = new Date(store.closedUntil)
    if (closedUntilDate > new Date()) {
      return { isOpen: false, text: "Temporarily closed", until: `until ${closedUntilDate.toLocaleDateString()}` }
    }
  }

  const now = new Date()
  const dayIndex = now.getDay()
  const filtered = orderType ? hours.filter(h => h.orderType === orderType) : hours
  const current = now.getHours() * 60 + now.getMinutes()

  // Check today's hours (handles wrap past midnight) and yesterday's hours
  // that extend into the early hours of today.
  const candidates: { open: string; close: string }[] = []
  const today = filtered.find(h => h.day === dayIndex && h.isActive)
  if (today) candidates.push({ open: today.open, close: today.close })
  const yesterday = filtered.find(h => h.day === (dayIndex + 6) % 7 && h.isActive)
  if (yesterday) candidates.push({ open: yesterday.open, close: yesterday.close })

  for (const h of candidates) {
    const [oh, om] = h.open.split(":").map(Number)
    const [ch, cm] = h.close.split(":").map(Number)
    const openTime = oh * 60 + om
    const closeTime = ch * 60 + cm

    if (closeTime <= openTime) {
      // Wraps past midnight: open today, closes tomorrow.
      if (current >= openTime || current < closeTime) {
        return { isOpen: true, text: "Open now", until: `until ${h.close}` }
      }
    } else {
      if (current >= openTime && current < closeTime) {
        return { isOpen: true, text: "Open now", until: `until ${h.close}` }
      }
    }
  }

  const base = today || yesterday
  return {
    isOpen: false,
    text: base ? "Closed" : "Closed today",
    until: "",
  }
}

export function formatHoursForType(
  hours: OpeningHour[],
  orderType: string
): string {
  const now = new Date()
  const dayIndex = now.getDay()
  const today = hours.find(h => h.day === dayIndex && h.isActive && h.orderType === orderType)
  if (!today) return "Closed"
  return `${today.open}–${today.close}`
}
