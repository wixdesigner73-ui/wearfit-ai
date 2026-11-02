import { Link } from 'react-router-dom'
import { Logo } from './Header'

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink pb-28 pt-14 text-white/70 md:pb-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Considered everyday clothing and a virtual fitting room experiment. Sample catalog only — nothing here is
            for sale.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/shop">Shop all</Link></li>
            <li><Link className="hover:text-white" to="/shop?category=dresses">Dresses</Link></li>
            <li><Link className="hover:text-white" to="/fitting-room">Virtual fitting room</Link></li>
            <li><Link className="hover:text-white" to="/wishlist">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Privacy</h3>
          <p className="mt-4 text-sm leading-relaxed">
            Fitting-room photos are processed in your browser only and are never uploaded or saved.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-4 pt-6 text-xs text-white/40 sm:px-6">
        © {new Date().getFullYear()} WearFit AI demo store. Product images are original illustrations.
      </div>
    </footer>
  )
}
