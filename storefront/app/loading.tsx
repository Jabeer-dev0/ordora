export default function RootLoading() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-card bg-card p-6 shadow-card border border-border">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
