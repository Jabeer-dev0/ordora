import { prisma } from "@ordora/shared/lib/prisma"
import Link from "next/link"
import { Store, ChevronRight } from "lucide-react"

export default async function HomePage() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-4">
          <h1 className="text-xl font-bold text-ink">Ordora</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-3xl font-bold text-ink">Our Restaurants</h2>
        <p className="mt-2 text-ink/50">Choose a restaurant to start ordering</p>
        {stores.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-ink/30">
            <Store className="mb-3 h-12 w-12" />
            <p>No restaurants available yet</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/${store.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:border-brand/30"
              >
                <div>
                  <h3 className="text-lg font-bold text-ink group-hover:text-brand transition">{store.name}</h3>
                  {store.address && <p className="mt-1 text-sm text-ink/50">{store.address}</p>}
                </div>
                <ChevronRight className="h-5 w-5 text-ink/30 group-hover:text-brand transition" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
