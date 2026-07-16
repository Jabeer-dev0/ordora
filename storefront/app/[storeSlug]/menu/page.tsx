import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import MenuClient from "./menu-client"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function getOpenStatus(hours: { day: number; open: string; close: string; isActive: boolean; orderType?: string }[], orderType?: string) {
  const now = new Date()
  const dayIndex = now.getDay()
  const filtered = orderType ? hours.filter(h => h.orderType === orderType) : hours
  const today = filtered.find(h => h.day === dayIndex && h.isActive)
  if (!today) return { isOpen: false, text: "Closed today", until: "" }
  const [oh, om] = today.open.split(":").map(Number)
  const [ch, cm] = today.close.split(":").map(Number)
  const current = now.getHours() * 60 + now.getMinutes()
  const openTime = oh * 60 + om
  const closeTime = ch * 60 + cm
  const isOpen = current >= openTime && current < closeTime
  return { isOpen, text: isOpen ? "Open now" : "Closed", until: isOpen ? `until ${today.close}` : "" }
}

function formatHoursForType(hours: { day: number; open: string; close: string; isActive: boolean; orderType: string }[], orderType: string): string {
  const now = new Date()
  const dayIndex = now.getDay()
  const today = hours.find(h => h.day === dayIndex && h.isActive && h.orderType === orderType)
  if (!today) return "Closed"
  return `${today.open}–${today.close}`
}

export default async function MenuPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    include: {
      tenant: true,
      menuItems: { where: { isAvailable: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] },
      modifierGroups: { include: { items: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
      openingHours: { orderBy: { day: "asc" } },
    },
  })
  if (!store || !store.isActive) notFound()

  const menuItems = store.menuItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: item.price,
    category: item.category,
    imageUrl: item.imageUrl,
    soldOut: item.soldOut,
    isFeatured: item.isFeatured,
    allergens: item.allergens,
  }))

  const categories = [...new Set(menuItems.map(i => i.category))]

  const modifierGroups = store.modifierGroups.map(mg => ({
    id: mg.id,
    name: mg.name,
    required: mg.required,
    minSelect: mg.minSelect,
    maxSelect: mg.maxSelect,
    items: mg.items.map(m => ({ id: m.id, name: m.name, price: m.price })),
  }))

  const itemModLinks: Record<string, string[]> = {}
  const itemModGroups = await prisma.menuItemModifierGroup.findMany({
    where: { menuItemId: { in: menuItems.map(i => i.id) } },
  })
  for (const link of itemModGroups) {
    if (!itemModLinks[link.menuItemId]) itemModLinks[link.menuItemId] = []
    itemModLinks[link.menuItemId].push(link.modifierGroupId)
  }

  const openingHours = store.openingHours as { day: number; open: string; close: string; isActive: boolean; orderType: string }[]
  const overallStatus = getOpenStatus(openingHours)
  const collectionStatus = getOpenStatus(openingHours, "COLLECTION")
  const deliveryStatus = getOpenStatus(openingHours, "DELIVERY")

  const storeData = {
    id: store.id,
    name: store.name,
    slug: store.slug,
    phone: store.phone,
    address: store.address,
    postcode: store.postcode,
    webServiceCharge: store.webServiceCharge,
    bagCharge: store.bagCharge,
  }

  const storeInfo = {
    isOpen: overallStatus.isOpen,
    hoursText: overallStatus.text,
    hoursUntil: overallStatus.until,
    address: store.address || "",
    phone: store.phone || "",
    collectionHours: formatHoursForType(openingHours, "COLLECTION"),
    deliveryHours: formatHoursForType(openingHours, "DELIVERY"),
  }

  return (
    <MenuClient
      store={storeData}
      menuItems={menuItems}
      categories={categories}
      modifierGroups={modifierGroups}
      itemModLinks={itemModLinks}
      storeInfo={storeInfo}
    />
  )
}
