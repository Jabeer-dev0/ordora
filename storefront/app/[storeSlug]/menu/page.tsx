import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import MenuClient from "./menu-client"

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

  const storeData = {
    id: store.id,
    name: store.name,
    slug: store.slug,
    phone: store.phone,
    address: store.address,
    webServiceCharge: store.webServiceCharge,
    bagCharge: store.bagCharge,
  }

  return (
    <MenuClient
      store={storeData}
      menuItems={menuItems}
      categories={categories}
      modifierGroups={modifierGroups}
      itemModLinks={itemModLinks}
    />
  )
}
