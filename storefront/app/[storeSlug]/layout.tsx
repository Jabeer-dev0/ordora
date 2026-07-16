import { prisma } from "@ordora/shared/lib/prisma"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

type Props = { params: Promise<{ storeSlug: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params
  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, include: { tenant: true } })
  if (!store) return { title: "Store not found" }
  return {
    title: `${store.name} | Order Online`,
    description: `Order online for collection or delivery from ${store.name}`,
  }
}

export default async function StoreLayout({ params, children }: Props) {
  const { storeSlug } = await params
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    include: { tenant: true },
  })
  if (!store || !store.isActive) notFound()

  const style = {
    "--brand": "#16a34a",
    "--brand-rgb": "22 163 74",
    "--accent": "#1e293b",
    "--accent-rgb": "30 41 59",
  } as React.CSSProperties

  return (
    <html lang="en-GB" style={style}>
      <body className="min-h-screen bg-paper font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
