export default function TenderDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Back link skeleton */}
      <div className="h-4 w-32 rounded bg-border" />

      {/* Title block */}
      <div className="space-y-2">
        <div className="h-6 w-3/4 rounded bg-border" />
        <div className="h-4 w-1/2 rounded bg-border" />
      </div>

      {/* Badges row */}
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-full bg-border" />
        <div className="h-7 w-20 rounded-full bg-border" />
        <div className="h-7 w-28 rounded-full bg-border" />
      </div>

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column — two sections */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-3 w-28 rounded bg-border" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-16 rounded bg-border" />
                  <div className="h-4 w-24 rounded bg-border" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-3 w-28 rounded bg-border" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 w-full rounded bg-border" />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-3 w-24 rounded bg-border" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-16 rounded bg-border" />
                  <div className="h-4 w-20 rounded bg-border" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
