import { Link } from 'react-router-dom'
import { HeartIcon } from '../components/Icons'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'
import { getProduct } from '../data/products'

export default function Wishlist() {
  const { wishlist } = useStore()
  const products = wishlist.map(getProduct).filter((p) => !!p)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Wishlist</h1>
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <HeartIcon width={44} height={44} className="text-ink/30" />
          <p className="text-ink/60">Tap the heart on any piece to save it here.</p>
          <Link to="/shop" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
            Browse the collection
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
