import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@ordora/shared/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.tenantId) return NextResponse.json([], { status: 401 })

  const store = await prisma.store.findFirst({
    where: { tenantId: session.user.tenantId, isActive: true },
  })
  if (!store) return NextResponse.json([])

  const items = await prisma.menuItem.findMany({
    where: { storeId: store.id, isAvailable: true },
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(items)
}
