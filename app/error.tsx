'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold text-risk-high">Щось пішло не так</h2>
      <p className="max-w-sm text-sm text-muted">
        {error.message || 'Невідома помилка. Спробуйте оновити сторінку.'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Спробувати знову
      </button>
    </div>
  )
}
