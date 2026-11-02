import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useStore } from '../context/StoreContext'
import type { Product } from '../types'
import GarmentArt from './GarmentArt'
import { HeartIcon, StarIcon } from './Icons'

export default function ProductCard({ product }: { product: Product }) {
  const { isWishlisted, toggleWishlist, notify } = useStore()
  const liked = isWishlisted(product.id)
  const firstColor = product.colors[0]

  return (
    <article className="group relative">
      <Link to={`/product/${product.id}`} className="block" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
        <div className="studio shine relative aspect-[4/5] overflow-hidden rounded-2xl">
          <GarmentArt
            type={product.garment}
            color={firstColor.hex}
            className="absolute inset-0 m-auto h-[78%] w-[78%] transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              {product.badge}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold sm:text-base">{product.name}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-ink/60">
              <StarIcon width={12} height={12} className="text-gold" />
              {product.rating} <span className="text-ink/40">({product.reviews})</span>
            </div>
          </div>
          <p className="text-sm font-semibold sm:text-base">{formatPrice(product.price)}</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5" aria-label={`${product.colors.length} colors`}>
          {product.colors.map((c) => (
            <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full border border-black/15" style={{ background: c.hex }} />
          ))}
        </div>
      </Link>

      <button
        onClick={() => {
          toggleWishlist(product.id)
          notify(liked ? 'Removed from wishlist' : 'Saved to wishlist')
        }}
        aria-pressed={liked}
        aria-label={liked ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        className="glass absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-sm transition-transform active:scale-90"
      >
        <HeartIcon width={18} height={18} filled={liked} className={liked ? 'text-rose-600' : 'text-ink'} />
      </button>
    </article>
  )
}
