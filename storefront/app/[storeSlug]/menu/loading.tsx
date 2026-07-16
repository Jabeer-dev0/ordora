export default function MenuLoading() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_340px] gap-0">
          <aside className="hidden lg:block">
            <div className="sticky top-[61px] pt-2">
              <div className="h-8 w-full animate-pulse rounded-lg bg-muted mb-1" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="mb-1 h-10 w-full animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </aside>
          <div className="lg:px-4">
            <div className="mb-6">
              <div className="mb-3 h-5 w-24 animate-pulse rounded bg-muted" />
              {[1, 2, 3].map(i => (
                <div key={i} className="mb-2 flex gap-4 rounded-xl border border-border bg-card p-3">
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="mt-1 h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-[61px] pt-2 pl-4">
              <div className="rounded-card-lg bg-card border border-border shadow-card p-4">
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-4 flex flex-col items-center py-8 text-muted-foreground">
                  <div className="mb-2 h-8 w-8 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
