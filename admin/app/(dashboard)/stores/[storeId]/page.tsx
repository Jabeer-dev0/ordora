import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import { StoreSettingsClient } from "./store-settings-client"

export const dynamic = "force-dynamic"

export default async function StoreSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      tenant: { select: { name: true, id: true, slug: true } },
      openingHours: { orderBy: { day: "asc" } },
      deliveryZones: { orderBy: { sortOrder: "asc" } },
    },
  })

  if (!store) notFound()

  return <StoreSettingsClient store={JSON.parse(JSON.stringify(store))} />
}
