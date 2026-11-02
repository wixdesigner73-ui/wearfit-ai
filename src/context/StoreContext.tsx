import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getProduct } from '../data/products'
import type { CartItem } from '../types'

const CART_KEY = 'wearfit.cart.v1'
const WISHLIST_KEY = 'wearfit.wishlist.v1'
const SELECTED_KEY = 'wearfit.selectedProduct.v1' // sessionStorage: last product chosen for the fitting room

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode / quota). The app keeps working in memory.
  }
}

interface StoreState {
  /** Product currently selected for the fitting room; shared by the shop, product page and fitting room. */
  selectedProductId: string | null
  selectProduct: (productId: string) => void
  cart: CartItem[]
  wishlist: string[]
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  toast: string | null
  openCart: () => void
  closeCart: () => void
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (item: Omit<CartItem, 'qty'>, qty: number) => void
  removeFromCart: (item: Omit<CartItem, 'qty'>) => void
  clearCart: () => void
  toggleWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  notify: (message: string) => void
}

const StoreContext = createContext<StoreState | null>(null)

const same = (a: Omit<CartItem, 'qty'>, b: Omit<CartItem, 'qty'>) =>
  a.productId === b.productId && a.size === b.size && a.color === b.color

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() =>
    // Drop anything that no longer exists in the catalog.
    load<CartItem[]>(CART_KEY, []).filter((i) => getProduct(i.productId) && i.qty > 0),
  )
  const [wishlist, setWishlist] = useState<string[]>(() =>
    load<string[]>(WISHLIST_KEY, []).filter((id) => getProduct(id)),
  )
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    try {
      const id = sessionStorage.getItem(SELECTED_KEY)
      return id && getProduct(id) ? id : null
    } catch {
      return null
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    save(CART_KEY, cart)
  }, [cart])
  useEffect(() => {
    save(WISHLIST_KEY, wishlist)
  }, [wishlist])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  const selectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId)
    try {
      sessionStorage.setItem(SELECTED_KEY, productId)
    } catch {
      /* ignore */
    }
  }, [])

  const notify = useCallback((message: string) => setToast(message), [])

  const addToCart = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => same(i, item))
      if (existing) return prev.map((i) => (same(i, item) ? { ...i, qty: Math.min(i.qty + qty, 10) } : i))
      return [...prev, { ...item, qty }]
    })
  }, [])

  const setQty = useCallback((item: Omit<CartItem, 'qty'>, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((i) => !same(i, item)) : prev.map((i) => (same(i, item) ? { ...i, qty: Math.min(qty, 10) } : i)),
    )
  }, [])

  const removeFromCart = useCallback((item: Omit<CartItem, 'qty'>) => {
    setCart((prev) => prev.filter((i) => !same(i, item)))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }, [])

  const value = useMemo<StoreState>(() => {
    const cartCount = cart.reduce((n, i) => n + i.qty, 0)
    const cartTotal = cart.reduce((sum, i) => sum + (getProduct(i.productId)?.price ?? 0) * i.qty, 0)
    return {
      selectedProductId,
      selectProduct,
      cart,
      wishlist,
      cartCount,
      cartTotal,
      cartOpen,
      toast,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted: (id) => wishlist.includes(id),
      notify,
    }
  }, [selectedProductId, selectProduct, cart, wishlist, cartOpen, toast, addToCart, setQty, removeFromCart, clearCart, toggleWishlist, notify])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreState {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
