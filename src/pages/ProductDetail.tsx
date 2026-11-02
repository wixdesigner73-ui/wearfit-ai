import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GarmentArt from '../components/GarmentArt'
import { CameraIcon, HeartIcon, StarIcon } from '../components/Icons'
import ProductCard from '../components/ProductCard'
import { ColorSelector, SizeSelector } from '../components/Selectors'
import { useStore } from '../context/StoreContext'
import { formatPrice, getProduct, PRODUCTS } from '../data/products'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { id } = useParams()
  const product = getProduct(id ?? '')
  if (!product) return <NotFound />
  // Remount on product change so selections reset.
  return <Detail key={product.id} productId={product.id} />
}

function Detail({ productId }: { productId: string }) {
  const product = getProduct(productId)!
  const { addToCart, openCart, isWishlisted, toggleWishlist, notify } = useStore()
  const [colorName, setColorName] = useState(product.colors[0].name)
  const [size, setSize] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState(false)

  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0]
  const liked = isWishlisted(product.id)
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  const add = () => {
    if (!size) {
      setSizeError(true)
      return
    }
    addToCart({ productId: product.id, size, color: color.name })
    openCart() // the drawer itself confirms the add
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink/50">
        <Link to="/shop" className="hover:text-ink">Shop</Link> /{' '}
        <Link to={`/shop?category=${product.category}`} className="capitalize hover:text-ink">{product.category}</Link>
      </nav>

      <div className="mt-4 grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="studio relative aspect-[4/5] overflow-hidden rounded-3xl md:sticky md:top-24 md:self-start">
          <GarmentArt
            type={product.garment}
            color={color.hex}
            title={`${product.name} in ${color.name}`}
            className="absolute inset-0 m-auto h-[82%] w-[82%] transition-all duration-300"
          />
          {product.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              {product.badge}
            </span>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
            <span className="flex items-center gap-1 text-sm text-ink/60">
              <StarIcon width={14} height={14} className="text-gold" /> {product.rating} ({product.reviews} reviews)
            </span>
          </div>
          <p className="mt-5 leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">Color: <span className="font-normal text-ink/60">{color.name}</span></p>
            <ColorSelector colors={product.colors} value={color.name} onChange={setColorName} />
          </div>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">
              Size {sizeError && <span role="alert" className="ml-2 font-normal text-rose-600">Please select a size</span>}
            </p>
            <SizeSelector
              sizes={product.sizes}
              value={size}
              onChange={(s) => {
                setSize(s)
                setSizeError(false)
              }}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={add}
              className="flex-1 rounded-full bg-ink py-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              Add to bag
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
            to={`/fitting-room?product=${product.id}&color=${encodeURIComponent(color.name)}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-full border border-gold bg-gold/10 py-3.5 text-sm font-semibold text-ink"
          >
            <CameraIcon width={18} height={18} className="text-gold" />
            Preview in fitting room <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold">Demo</span>
          </Link>

          <ul className="mt-8 space-y-2 border-t border-black/10 pt-6 text-sm text-ink/70">
            {product.details.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-20">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
