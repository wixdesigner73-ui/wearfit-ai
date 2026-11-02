import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { ALL_CATEGORIES, CATEGORIES_BY_GENDER, PRODUCTS } from '../data/products'
import type { CategoryName, Gender } from '../types'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name A–Z' },
]

const COPY: Record<Gender | 'all', { eyebrow: string; title: string; blurb: string }> = {
  all: { eyebrow: 'The collection', title: 'All clothing', blurb: 'Every piece in the catalog, men and women.' },
  men: { eyebrow: 'Men', title: "Men's collection", blurb: 'Tees, polos, shirts, hoodies, denim, tailoring and jackets.' },
  women: { eyebrow: 'Women', title: "Women's collection", blurb: 'Tops, dresses, kurtis, trousers, co-ord sets, shirts and jackets.' },
}

/** `gender` fixes the collection (used by /men and /women). On /shop the gender is a filter. */
export default function Shop({ gender }: { gender?: Gender }) {
  const [params, setParams] = useSearchParams()

  const genderFilter: Gender | null = gender ?? (params.get('gender') === 'men' || params.get('gender') === 'women' ? (params.get('gender') as Gender) : null)
  const categoryOptions: CategoryName[] = genderFilter ? CATEGORIES_BY_GENDER[genderFilter] : ALL_CATEGORIES
  const rawCategory = params.get('category')
  const category = categoryOptions.find((c) => c === rawCategory) ?? null
  const sort = SORTS.find((s) => s.id === params.get('sort'))?.id ?? 'featured'
  const query = params.get('q') ?? ''
  const inStockOnly = params.get('available') === '1'

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
        (!genderFilter || p.gender === genderFilter) &&
        (!category || p.category === category) &&
        (!inStockOnly || p.stock !== 'out-of-stock') &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.productType.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.colors.some((c) => c.name.toLowerCase().includes(q))),
    )
    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price)
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name))
      default:
        return list
    }
  }, [genderFilter, category, sort, query, inStockOnly])

  const copy = COPY[genderFilter ?? 'all']
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
      active ? 'border-ink bg-ink text-white' : 'border-black/15 bg-white hover:border-ink'
    }`
  const count = (c: CategoryName) => PRODUCTS.filter((p) => (!genderFilter || p.gender === genderFilter) && p.category === c).length

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{copy.eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{copy.title}</h1>
      <p className="mt-3 max-w-xl text-ink/60">{copy.blurb}</p>

      <div className="sticky top-16 z-30 -mx-4 mt-8 border-b border-black/5 bg-cream/90 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        {!gender && (
          <div className="scroll-hide mb-3 flex gap-2 overflow-x-auto" role="group" aria-label="Filter by collection">
            <button className={chip(!genderFilter)} aria-pressed={!genderFilter} onClick={() => { update('gender', null); update('category', null) }}>
              Everyone
            </button>
            <button className={chip(genderFilter === 'men')} aria-pressed={genderFilter === 'men'} onClick={() => { update('gender', 'men'); update('category', null) }}>
              Men
            </button>
            <button className={chip(genderFilter === 'women')} aria-pressed={genderFilter === 'women'} onClick={() => { update('gender', 'women'); update('category', null) }}>
              Women
            </button>
          </div>
        )}
        <div className="scroll-hide flex gap-2 overflow-x-auto" role="group" aria-label="Filter by category">
          <button className={chip(!category)} aria-pressed={!category} onClick={() => update('category', null)}>
            All categories
          </button>
          {categoryOptions.map((c) => (
            <button key={c} className={chip(category === c)} aria-pressed={category === c} onClick={() => update('category', c)}>
              {c} ({count(c)})
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => update('q', e.target.value || null)}
            placeholder="Search name, type or color"
            aria-label="Search products"
            className="min-w-0 flex-1 basis-48 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
          />
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value === 'featured' ? null : e.target.value)}
            aria-label="Sort products"
            className="rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => update('available', e.target.checked ? '1' : null)} className="h-4 w-4 accent-ink" />
            In stock only
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink/55" aria-live="polite">
        {products.length} {products.length === 1 ? 'piece' : 'pieces'}
      </p>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg font-medium">No pieces match your filters.</p>
          <button
            onClick={() => setParams({}, { replace: true })}
            className="mt-4 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
