import { prisma } from "@ordora/shared/lib/prisma"
import Link from "next/link"
import { Store } from "lucide-react"

export const revalidate = 60

export default async function HomePage() {
  const stores = await prisma.store.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <span className="text-lg font-bold text-foreground">Ordora</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-3xl tracking-tight text-foreground">Our Restaurants</h1>
        <p className="mt-2 text-muted-foreground">Choose a restaurant to start ordering</p>
        {stores.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-muted-foreground">
            <Store className="mb-3 h-12 w-12 opacity-30" />
            <p>No restaurants available yet</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {stores.map((store) => (
              <Link key={store.id} href={`/${store.slug}`}
                className="group rounded-card bg-card p-6 shadow-card border border-border lift">
                <h3 className="font-display text-xl text-foreground">{store.name}</h3>
                {store.address && <p className="mt-1 text-sm text-muted-foreground">{store.address}</p>}
                <span className="mt-3 inline-block text-sm font-semibold text-secondary group-hover:underline">Order now →</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
