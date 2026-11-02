import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CameraIcon, HeartIcon } from '../components/Icons'
import ProductCard, { ProductImage, StockTag } from '../components/ProductCard'
import { ColorSelector, SizeSelector } from '../components/Selectors'
import { useStore } from '../context/StoreContext'
import { formatPrice, getProduct, PRODUCTS, STOCK_LABEL } from '../data/products'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { id } = useParams()
  const product = getProduct(id ?? '')
  if (!product) return <NotFound />
  // Remount on product change so size/colour selections reset.
  return <Detail key={product.id} productId={product.id} />
}

function Detail({ productId }: { productId: string }) {
  const product = getProduct(productId)!
  const { addToCart, openCart, isWishlisted, toggleWishlist, notify, selectProduct } = useStore()
  const [colorName, setColorName] = useState(product.colors[0].name)
  const [size, setSize] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState(false)

  // Viewing a product makes it the current fitting-room selection (kept in sync across the site).
  useEffect(() => {
    selectProduct(product.id)
  }, [product.id, selectProduct])

  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0]
  const pictured = product.colors.find((c) => c.pictured) ?? product.colors[0]
  const liked = isWishlisted(product.id)
  const soldOut = product.stock === 'out-of-stock'
  const unavailable = soldOut ? product.sizes : (product.soldOutSizes ?? [])

  const related = [
    ...PRODUCTS.filter((p) => p.id !== product.id && p.gender === product.gender && p.category === product.category),
    ...PRODUCTS.filter((p) => p.id !== product.id && p.gender === product.gender && p.category !== product.category),
  ].slice(0, 4)

  const add = () => {
    if (soldOut) return
    if (!size) {
      setSizeError(true)
      return
    }
    addToCart({ productId: product.id, size, color: color.name })
    openCart() // the drawer itself confirms the add
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink/50">
        <Link to="/shop" className="hover:text-ink">Shop</Link> /{' '}
        <Link to={`/${product.gender}`} className="capitalize hover:text-ink">{product.gender}</Link> /{' '}
        <Link to={`/${product.gender}?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">{product.category}</Link>
      </nav>

      <div className="mt-5 grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="relative md:sticky md:top-24 md:self-start">
          <ProductImage product={product} className="rounded-2xl" eager />
          <div className="absolute left-4 top-4 flex gap-2">
            {product.badge && !soldOut && (
              <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{product.badge}</span>
            )}
            <StockTag product={product} />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">{product.productType}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-4">
            <p className="text-2xl font-medium">{formatPrice(product.price)}</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                product.stock === 'in-stock' ? 'bg-emerald-100 text-emerald-800' : product.stock === 'low-stock' ? 'bg-amber-100 text-amber-800' : 'bg-black/10 text-ink/70'
              }`}
            >
              {STOCK_LABEL[product.stock]}
            </span>
          </div>
          <p className="mt-5 leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">
              Color: <span className="font-normal text-ink/60">{color.name}</span>
            </p>
            <ColorSelector colors={product.colors} value={color.name} onChange={setColorName} />
            <p className="mt-3 text-xs text-ink/50">
              The photo shows <strong>{pictured.name}</strong>. {product.colors.length > 1 && 'Other colors are listed as options; this demo has photographs of the pictured color only.'}
            </p>
          </div>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">
              Size {sizeError && <span role="alert" className="ml-2 font-normal text-rose-600">Please select a size</span>}
            </p>
            <SizeSelector
              sizes={product.sizes}
              value={size}
              unavailable={unavailable}
              onChange={(s) => {
                setSize(s)
                setSizeError(false)
              }}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={add}
              disabled={soldOut}
              className="flex-1 rounded-full bg-ink py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {soldOut ? 'Out of stock' : 'Add to bag'}
            </button>
            <button
              onClick={() => {
                toggleWishlist(product.id)
                notify(liked ? 'Removed from wishlist' : 'Saved to wishlist')
              }}
              aria-pressed={liked}
              aria-label={liked ? 'Remove from wishlist' : 'Save to wishlist'}
              className="grid h-[3.25rem] w-[3.25rem] place-items-center rounded-full border border-black/20 bg-white"
            >
              <HeartIcon filled={liked} className={liked ? 'text-rose-600' : ''} />
            </button>
          </div>

          <Link
            to={`/fitting-room?product=${product.id}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-full border border-gold bg-gold/10 py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em]"
          >
            <CameraIcon width={18} height={18} className="text-gold" />
            Try it on in the fitting room
          </Link>

          <ul className="mt-9 space-y-2.5 border-t border-black/10 pt-6 text-sm text-ink/70">
            {product.details.map((d) => (
              <li key={d} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-24">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
