import { Link } from 'react-router-dom'
import { BagIcon, MinusIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { asset } from '../config'
import { useStore } from '../context/StoreContext'
import { formatPrice, getProduct } from '../data/products'

export default function Cart() {
  const { cart, cartTotal, cartCount, setQty, removeFromCart, clearCart } = useStore()

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">Your bag</h1>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <BagIcon width={44} height={44} className="text-ink/30" />
          <p className="text-ink/60">Your bag is empty.</p>
          <Link to="/shop" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">Browse the collection</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-4">
            {cart.map((item) => {
              const product = getProduct(item.productId)
              if (!product) return null
              return (
                <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 rounded-2xl bg-white p-4">
                  <Link to={`/product/${product.id}`} className="photo-bg block h-36 w-28 shrink-0 overflow-hidden rounded-xl">
                    <img src={asset(product.image)} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/product/${product.id}`} className="block truncate font-medium hover:underline">{product.name}</Link>
                        <p className="text-sm text-ink/60">{item.color} · Size {item.size}</p>
                        <p className="text-sm text-ink/60">{formatPrice(product.price)} each</p>
                      </div>
                      <button onClick={() => removeFromCart(item)} className="h-fit text-ink/40 hover:text-rose-600" aria-label={`Remove ${product.name}`}>
                        <TrashIcon width={20} height={20} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-black/15">
                        <button onClick={() => setQty(item, item.qty - 1)} className="grid h-9 w-9 place-items-center" aria-label="Decrease quantity">
                          <MinusIcon width={15} height={15} />
                        </button>
                        <span className="w-8 text-center" aria-live="polite">{item.qty}</span>
                        <button onClick={() => setQty(item, item.qty + 1)} className="grid h-9 w-9 place-items-center" aria-label="Increase quantity">
                          <PlusIcon width={15} height={15} />
                        </button>
                      </div>
                      <p className="text-lg font-medium">{formatPrice(product.price * item.qty)}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <aside className="h-fit rounded-2xl bg-white p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink/60">Items</dt><dd>{cartCount}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Subtotal</dt><dd>{formatPrice(cartTotal)}</dd></div>
            </dl>
            <p className="mt-4 rounded-xl bg-sand p-3 text-xs leading-relaxed text-ink/70">
              Demo store: checkout is not connected. No payment is taken and no order can be placed.
            </p>
            <button disabled className="mt-4 w-full cursor-not-allowed rounded-full bg-ink py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white opacity-40">
              Checkout unavailable
            </button>
            <button onClick={clearCart} className="mt-3 w-full py-2 text-xs text-ink/50 hover:text-ink">Clear bag</button>
          </aside>
        </div>
      )}
    </div>
  )
}
