import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { BagIcon, CameraIcon, CloseIcon, GridIcon, HeartIcon, HomeIcon, MenuIcon } from './Icons'

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-baseline gap-1.5" aria-label="WearFit AI home">
      <span className={`font-display text-[1.65rem] font-semibold leading-none tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        WearFit
      </span>
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-gold">AI</span>
    </Link>
  )
}

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/men', label: 'Men' },
  { to: '/women', label: 'Women' },
  { to: '/fitting-room', label: 'Fitting Room' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `link-underline pb-0.5 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors ${
    isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'
  }`

export default function Header() {
  const { cartCount, wishlist, openCart } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-black/5 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="-ml-2 rounded-full p-2 hover:bg-black/5 lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <Logo />
          </div>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={desktopLink}>
                {n.label}
              </NavLink>
            ))}
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
            <button onClick={openCart} className="relative rounded-full p-2.5 hover:bg-black/5" aria-label={`Open cart, ${cartCount} items`}>
              <BagIcon />
              {cartCount > 0 && <Badge>{cartCount}</Badge>}
            </button>
          </div>
        </div>

        {/* Mobile / tablet menu */}
        {menuOpen && (
          <nav className="animate-fade border-t border-black/5 bg-cream px-4 pb-5 pt-3 lg:hidden" aria-label="Menu">
            <ul className="grid grid-cols-2 gap-x-6">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    className={({ isActive }) =>
                      `block border-b border-black/5 py-3.5 text-sm font-medium uppercase tracking-[0.14em] ${isActive ? 'text-gold' : 'text-ink'}`
                    }
                  >
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
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
