import { Link, useNavigate } from 'react-router-dom'
import { asset } from '../config'
import { formatPrice, STOCK_LABEL } from '../data/products'
import { useStore } from '../context/StoreContext'
import type { Product } from '../types'
import { CameraIcon, HeartIcon } from './Icons'

export function ProductImage({ product, className = '', eager }: { product: Product; className?: string; eager?: boolean }) {
  return (
    <div className={`photo-bg photo-zoom relative aspect-[4/5] overflow-hidden ${className}`}>
      <img
        src={asset(product.image)}
        alt={`${product.name} in ${product.colors[0].name}`}
        width={900}
        height={1125}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  )
}

export function StockTag({ product }: { product: Product }) {
  if (product.stock === 'in-stock') return null
  const tone = product.stock === 'out-of-stock' ? 'bg-ink text-white' : 'bg-white text-gold'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
      {STOCK_LABEL[product.stock]}
    </span>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  const { isWishlisted, toggleWishlist, notify, selectProduct } = useStore()
  const navigate = useNavigate()
  const liked = isWishlisted(product.id)
  const soldOut = product.stock === 'out-of-stock'

  return (
    <article className="group">
      <div className="relative">
        <Link to={`/product/${product.id}`} className="block" aria-label={`View ${product.name}`}>
          <ProductImage product={product} className={soldOut ? 'opacity-70' : ''} />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.badge && !soldOut && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              {product.badge}
            </span>
          )}
          <StockTag product={product} />
        </div>

        <button
          onClick={() => {
            toggleWishlist(product.id)
            notify(liked ? "Removed from wishlist" : "Saved to wishlist")
          }}
          aria-pressed={liked}
          aria-label={liked ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="glass absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-sm transition-transform active:scale-90"
        >
          <HeartIcon width={18} height={18} filled={liked} className={liked ? "text-rose-600" : "text-ink"} />
        </button>

        {/* Quick try-on: revealed on hover (pointer devices) or keyboard focus; touch users use the product page. */}
        <button
          onClick={() => {
            selectProduct(product.id)
            navigate(`/fitting-room?product=${product.id}`)
          }}
          className="glass absolute inset-x-3 bottom-3 hidden items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold uppercase tracking-wider opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100 md:flex"
          aria-label={`Try on ${product.name} in the virtual fitting room`}
        >
          <CameraIcon width={15} height={15} /> Try on
        </button>
      </div>

      <Link to={`/product/${product.id}`} className="mt-3.5 block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/45">{product.productType}</p>
            <h3 className="mt-0.5 truncate text-[15px] font-medium">{product.name}</h3>
          </div>
          <p className="shrink-0 text-[15px] font-medium">{formatPrice(product.price)}</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5" aria-label={`${product.colors.length} colors`}>
          {product.colors.map((c) => (
            <span key={c.name} title={c.name} className="h-3 w-3 rounded-full border border-black/15" style={{ background: c.hex }} />
          ))}
        </div>
      </Link>
    </article>
  )
}
