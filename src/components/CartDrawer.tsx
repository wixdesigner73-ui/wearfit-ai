import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, getProduct } from '../data/products'
import { useStore } from '../context/StoreContext'
import GarmentArt from './GarmentArt'
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from './Icons'

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, cartTotal, cartCount, setQty, removeFromCart, clearCart, notify } = useStore()

  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [cartOpen, closeCart])

  return (
    // `invisible` (after the slide-out finishes) removes the closed drawer from tab order and screen readers.
    <div
      className={`fixed inset-0 z-50 transition-[visibility] duration-300 ${cartOpen ? 'visible' : 'invisible pointer-events-none'}`}
    >
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${cartOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ease-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <h2 className="font-display text-xl font-semibold">Your bag ({cartCount})</h2>
          <button onClick={closeCart} className="rounded-full p-2 hover:bg-black/5" aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <BagIcon width={44} height={44} className="text-ink/30" />
            <p className="text-ink/60">Your bag is empty.</p>
            <Link to="/shop" onClick={closeCart} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {cart.map((item) => {
                const product = getProduct(item.productId)
                if (!product) return null
                const color = product.colors.find((c) => c.name === item.color) ?? product.colors[0]
                const key = `${item.productId}-${item.size}-${item.color}`
                return (
                  <li key={key} className="flex gap-4 rounded-2xl bg-white p-3">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={closeCart}
                      className="studio grid h-24 w-20 shrink-0 place-items-center rounded-xl"
                    >
                      <GarmentArt type={product.garment} color={color.hex} className="h-[85%] w-[85%]" flat />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <p className="truncate font-semibold">{product.name}</p>
                        <button
                          onClick={() => removeFromCart(item)}
                          className="text-ink/40 hover:text-rose-600"
                          aria-label={`Remove ${product.name}`}
                        >
                          <TrashIcon width={18} height={18} />
                        </button>
                      </div>
                      <p className="text-xs text-ink/60">
                        {item.color} · Size {item.size}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border border-black/15">
                          <button
                            onClick={() => setQty(item, item.qty - 1)}
                            className="grid h-8 w-8 place-items-center"
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon width={14} height={14} />
                          </button>
                          <span className="w-6 text-center text-sm" aria-live="polite">{item.qty}</span>
                          <button
                            onClick={() => setQty(item, item.qty + 1)}
                            className="grid h-8 w-8 place-items-center"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon width={14} height={14} />
                          </button>
                        </div>
                        <p className="font-semibold">{formatPrice(product.price * item.qty)}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-black/10 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink/50">Demo store — checkout is not connected and no payment is taken.</p>
              <button
                onClick={() => notify('Demo store: checkout is not connected')}
                className="mt-4 w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Checkout (demo)
              </button>
              <button onClick={clearCart} className="mt-2 w-full py-2 text-xs text-ink/50 hover:text-ink">
                Clear bag
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
