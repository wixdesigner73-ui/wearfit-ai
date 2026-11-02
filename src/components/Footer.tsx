import { Link } from 'react-router-dom'
import { Logo } from './Header'

const col = 'text-[13px] leading-8 text-white/65 transition-colors hover:text-white'

export default function Footer() {
  return (
    <footer className="mt-28 bg-ink pb-28 pt-16 text-white/70 md:pb-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            Modern everyday fashion with a virtual fitting room. This is a demonstration store: products are sample listings and
            nothing here can be purchased.
          </p>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Shop</h3>
          <ul className="mt-4">
            <li><Link className={col} to="/shop">All products</Link></li>
            <li><Link className={col} to="/men">Men</Link></li>
            <li><Link className={col} to="/women">Women</Link></li>
            <li><Link className={col} to="/wishlist">Wishlist</Link></li>
            <li><Link className={col} to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Company</h3>
          <ul className="mt-4">
            <li><Link className={col} to="/fitting-room">Virtual fitting room</Link></li>
            <li><Link className={col} to="/about">About</Link></li>
            <li><Link className={col} to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Your photos</h3>
          <p className="mt-4 text-sm leading-relaxed">
            Fitting-room photos are never stored on this site. When you generate an AI try-on, your photo is sent to the AI server
            you connect, only after you agree, and is processed in memory.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-14 max-w-7xl border-t border-white/10 px-4 pt-6 text-xs leading-relaxed text-white/40 sm:px-6">
        © {new Date().getFullYear()} WearFit AI demo store. Product photographs are free-to-use images from{' '}
        <a className="underline underline-offset-2 hover:text-white" href="https://www.pexels.com" target="_blank" rel="noreferrer">
          Pexels
        </a>
        ; see the credits file in the repository. AI-generated previews are illustrations only and do not guarantee size or fit.
      </div>
    </footer>
  )
}
