export default function StoreLoading() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-11 w-16 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="pt-6 pb-4">
          <div className="mb-4 h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-card bg-card border border-border p-3 shadow-card">
                <div className="mb-2 h-28 w-full animate-pulse rounded-xl bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="mt-1 h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
