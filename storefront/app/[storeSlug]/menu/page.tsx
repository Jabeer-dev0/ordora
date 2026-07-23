import { notFound } from "next/navigation"
import MenuClient from "./menu-client"
import { getStoreBySlug } from "@/lib/store"
import { getStoreOpenStatus, formatHoursForType } from "@/lib/hours"
import { storefrontApi } from "@/lib/api"

export const revalidate = 30

export default async function MenuPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params
  const store = await getStoreBySlug(storeSlug)
  if (!store || !store.isActive) notFound()

  let menuData: any = { categories: [] }
  let openingHours: any[] = []
  try {
    const [m, h] = await Promise.all([
      storefrontApi.menu(storeSlug),
      storefrontApi.openingHours(storeSlug),
    ])
    menuData = m
    openingHours = h.openingHours || []
  } catch {
    notFound()
  }

  const categories = (menuData.categories || []).map((c: any) => c.name)

  // Flatten modifier groups + build item→group links from nested API response.
  const modifierGroups: any[] = []
  const itemModLinks: Record<string, string[]> = {}
  for (const cat of menuData.categories || []) {
    for (const item of cat.items || []) {
      const links: string[] = []
      for (const g of item.groups || []) {
        modifierGroups.push({
          id: g.id,
          name: g.name,
          required: g.required,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          items: (g.modifiers || []).map((mod: any) => ({
            id: mod.id,
            name: mod.name,
            price: mod.price,
            maxQuantity: 1,
          })),
        })
        links.push(g.id)
      }
      itemModLinks[item.id] = links
    }
  }

  const menuItems = (menuData.categories || []).flatMap((c: any) =>
    (c.items || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      description: i.description || "",
      price: i.price,
      category: i.category,
      imageUrl: i.imageUrl,
      soldOut: false,
      isFeatured: i.isFeatured,
      allergens: "",
    }))
  )

  const hours = openingHours as { day: number; open: string; close: string; isActive: boolean; orderType: string }[]
  const overallStatus = getStoreOpenStatus({ acceptingOrders: store.acceptingOrders, closedUntil: store.closedUntil }, hours)

  const storeData = {
    id: store.id,
    name: store.name,
    slug: store.slug,
    phone: store.phone,
    address: store.address,
    postcode: store.postcode,
    webServiceCharge: 0,
    bagCharge: 0,
    deliveryFee: 0,
    logoUrl: store.tenant?.logoUrl || null,
    brandColor: store.brandColor || null,
    accentColor: store.accentColor || null,
    tagline: store.tagline || null,
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
