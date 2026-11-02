import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { BagIcon, CameraIcon, GridIcon, HeartIcon, HomeIcon } from './Icons'

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2" aria-label="WearFit AI home">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-gold-soft">
        <svg viewBox="0 0 64 64" width="20" height="20" aria-hidden="true">
          <path d="M20 18l-10 8 6 8 5-3v21h22V31l5 3 6-8-10-8-5 4a7 7 0 0 1-14 0z" fill="currentColor" />
        </svg>
      </span>
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        WearFit<span className="text-gold"> AI</span>
      </span>
    </Link>
  )
}

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-ink ${isActive ? 'text-ink' : 'text-ink/60'}`

export default function Header() {
  const { cartCount, wishlist, openCart } = useStore()

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-black/5 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            <NavLink to="/" end className={desktopLink}>Home</NavLink>
            <NavLink to="/shop" className={desktopLink}>Shop</NavLink>
            <NavLink to="/fitting-room" className={desktopLink}>
              Fitting Room
              <span className="ml-1.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
                Demo
              </span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              to="/wishlist"
              className="relative hidden rounded-full p-2.5 hover:bg-black/5 md:block"
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <HeartIcon />
              {wishlist.length > 0 && <Badge>{wishlist.length}</Badge>}
            </Link>
            <button
              onClick={openCart}
              className="relative rounded-full p-2.5 hover:bg-black/5"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <BagIcon />
              {cartCount > 0 && <Badge>{cartCount}</Badge>}
            </button>
          </div>
        </div>
      </header>

      <MobileTabBar />
    </>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
      {children}
    </span>
  )
}

function MobileTabBar() {
  const { wishlist } = useStore()
  const item = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-ink/50'}`

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-black/5 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile"
    >
      <div className="mx-auto flex max-w-md">
        <NavLink to="/" end className={item}>
          <HomeIcon />
          Home
        </NavLink>
        <NavLink to="/shop" className={item}>
          <GridIcon />
          Shop
        </NavLink>
        <NavLink to="/fitting-room" className={item}>
          <CameraIcon />
          Try-On
        </NavLink>
        <NavLink to="/wishlist" className={item}>
          <span className="relative">
            <HeartIcon />
            {wishlist.length > 0 && (
              <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
                {wishlist.length}
              </span>
            )}
          </span>
          Wishlist
        </NavLink>
      </div>
    </nav>
  )
}
