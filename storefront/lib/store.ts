import { prisma } from "@ordora/shared/lib/prisma"
import { cache } from "react"

export const getStoreBySlug = cache(async (slug: string) => {
  return prisma.store.findUnique({
    where: { slug },
    include: { tenant: true },
  })
})
