'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Search, X } from 'lucide-react'

export default function SearchBar({ placeholder = 'Пошук тендерів, компаній, ЄДРПОУ...' }) {
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name?: string; title?: string; type: string }>>([])
  const [open,        setOpen]        = useState(false)
  const [idx,         setIdx]         = useState(-1)
  const router  = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setOpen(false); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const list = await api.search.autocomplete(query).catch(() => [])
      setSuggestions(list)
      setOpen(list.length > 0)
    }, 250)
    return () => clearTimeout(timerRef.current)
  }, [query])

  // Закрити при кліку поза
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const submit = (q: string) => {
    if (!q.trim()) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const pickSuggestion = (s: typeof suggestions[0]) => {
    setOpen(false)
    if (s.type === 'company') {
      router.push(`/companies/${s.id}`)
    } else {
      router.push(`/tenders/${s.id}`)
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 focus-within:border-accent transition-colors">
        <Search size={18} className="shrink-0 text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIdx(-1) }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (idx >= 0) pickSuggestion(suggestions[idx])
              else submit(query)
            }
            if (e.key === 'ArrowDown') setIdx(i => Math.min(i + 1, suggestions.length - 1))
            if (e.key === 'ArrowUp')   setIdx(i => Math.max(i - 1, -1))
            if (e.key === 'Escape')    setOpen(false)
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder:text-muted outline-none text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); setOpen(false) }}>
            <X size={16} className="text-muted hover:text-white" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.id}`}
              onClick={() => pickSuggestion(s)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors
                ${i === idx ? 'bg-white/5' : ''}`}
            >
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium
                ${s.type === 'company' ? 'bg-accent/20 text-accent' : 'bg-border text-muted'}`}>
                {s.type === 'company' ? 'Компанія' : 'Тендер'}
              </span>
              <span className="text-white truncate">{s.name ?? s.title}</span>
              {s.type === 'company' && (
                <span className="ml-auto text-xs text-muted shrink-0">{s.id}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
