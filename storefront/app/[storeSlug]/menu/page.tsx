import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import MenuClient from "./menu-client"
import { getStoreBySlug } from "@/lib/store"

export const revalidate = 30

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
  const store = await getStoreBySlug(storeSlug)
  if (!store || !store.isActive) notFound()

  const [menuItemsRaw, modifierGroupsRaw, itemModGroups, openingHours] = await Promise.all([
    prisma.menuItem.findMany({ where: { storeId: store.id, isAvailable: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.modifierGroup.findMany({ where: { storeId: store.id }, include: { items: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } }),
    prisma.menuItemModifierGroup.findMany({ where: { menuItem: { storeId: store.id } } }),
    prisma.storeOpeningHour.findMany({ where: { storeId: store.id }, orderBy: { day: "asc" } }),
  ])

  const menuItems = menuItemsRaw.map(item => ({
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

  const modifierGroups = modifierGroupsRaw.map(mg => ({
    id: mg.id,
    name: mg.name,
    required: mg.required,
    minSelect: mg.minSelect,
    maxSelect: mg.maxSelect,
    items: mg.items.map(m => ({ id: m.id, name: m.name, price: m.price })),
  }))

  const itemModLinks: Record<string, string[]> = {}
  for (const link of itemModGroups) {
    if (!itemModLinks[link.menuItemId]) itemModLinks[link.menuItemId] = []
    itemModLinks[link.menuItemId].push(link.modifierGroupId)
  }

  const hours = openingHours as { day: number; open: string; close: string; isActive: boolean; orderType: string }[]
  const overallStatus = getOpenStatus(hours)

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
    collectionHours: formatHoursForType(hours, "COLLECTION"),
    deliveryHours: formatHoursForType(hours, "DELIVERY"),
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
