import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, PRODUCTS } from '../data/products'
import type { CategoryId } from '../types'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const category = CATEGORIES.find((c) => c.id === params.get('category'))?.id ?? null
  const sort = (SORTS.find((s) => s.id === params.get('sort'))?.id ?? 'featured') as Sort
  const query = params.get('q') ?? ''

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = PRODUCTS.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.colors.some((c) => c.name.toLowerCase().includes(q))),
    )
    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price)
      case 'rating':
        return [...list].sort((a, b) => b.rating - a.rating)
      default:
        return list
    }
  }, [category, sort, query])

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      active ? 'border-ink bg-ink text-white' : 'border-black/15 bg-white hover:border-ink'
    }`

  const count = (id: CategoryId) => PRODUCTS.filter((p) => p.category === id).length

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">
        {category ? CATEGORIES.find((c) => c.id === category)!.label : 'All clothing'}
      </h1>
      <p className="mt-1 text-ink/60">
        {products.length} {products.length === 1 ? 'piece' : 'pieces'}
      </p>

      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-cream/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <div className="scroll-hide flex gap-2 overflow-x-auto" role="group" aria-label="Filter by category">
          <button className={chip(!category)} aria-pressed={!category} onClick={() => update('category', null)}>
            All ({PRODUCTS.length})
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={chip(category === c.id)} aria-pressed={category === c.id} onClick={() => update('category', c.id)}>
              {c.label} ({count(c.id)})
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => update('q', e.target.value || null)}
            placeholder="Search name or color"
            aria-label="Search products"
            className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
          />
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value === 'featured' ? null : e.target.value)}
            aria-label="Sort products"
            className="rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg font-medium">No pieces match your filters.</p>
          <button onClick={() => setParams({}, { replace: true })} className="mt-4 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
