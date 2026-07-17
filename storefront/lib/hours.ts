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
  const today = filtered.find(h => h.day === dayIndex && h.isActive)

  if (!today) {
    return { isOpen: false, text: "Closed today", until: "" }
  }

  const [oh, om] = today.open.split(":").map(Number)
  const [ch, cm] = today.close.split(":").map(Number)
  const current = now.getHours() * 60 + now.getMinutes()
  const openTime = oh * 60 + om
  const closeTime = ch * 60 + cm
  const isOpen = current >= openTime && current < closeTime

  return {
    isOpen,
    text: isOpen ? "Open now" : "Closed",
    until: isOpen ? `until ${today.close}` : "",
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
