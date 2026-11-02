import { Link } from 'react-router-dom'
import { ArrowRightIcon, CameraIcon, ShieldIcon } from '../components/Icons'
import ProductCard from '../components/ProductCard'
import { asset } from '../config'
import { getProduct, PRODUCTS } from '../data/products'
import type { Product } from '../types'

const MARQUEE = ['New season', 'Studio-shot photography', 'Men & Women', 'Virtual fitting room', 'Everyday essentials']

function Photo({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <div className={`photo-bg overflow-hidden ${className}`}>
      <img src={asset(product.image)} alt={product.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    </div>
  )
}

function SectionHead({ eyebrow, title, to, cta = 'View all' }: { eyebrow: string; title: string; to?: string; cta?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="link-underline hidden shrink-0 pb-0.5 text-[13px] font-medium uppercase tracking-[0.14em] sm:block">
          {cta}
        </Link>
      )}
    </div>
  )
}

export default function Home() {
  const newArrivals = PRODUCTS.filter((p) => p.badge === 'New').slice(0, 4)
  const bestsellers = PRODUCTS.filter((p) => p.badge === 'Bestseller').slice(0, 4)
  const heroWomen = getProduct('floral-co-ord-set')!
  const heroMen = getProduct('cognac-leather-jacket')!
  const menTile = getProduct('essential-black-hoodie')!
  const womenTile = getProduct('lemon-fitted-dress')!
  const layer1 = getProduct('signal-red-bomber')!
  const layer2 = getProduct('beige-tailored-blazer')!
  const layer3 = getProduct('chambray-relaxed-shirt')!
  const tryOnProduct = getProduct('saffron-printed-kurti')!

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:py-20 lg:gap-16">
          <div className="animate-rise">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold-soft">Autumn / Winter Collection</p>
            <h1 className="mt-5 font-display text-[2.9rem] font-medium leading-[1.04] sm:text-6xl lg:text-7xl">
              Dress for the
              <br />
              <em className="font-medium italic text-gold-soft">moment.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
              Considered everyday pieces for men and women, photographed in the studio, plus a virtual fitting room to preview
              them on you.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform hover:scale-[1.03]"
              >
                Shop now <ArrowRightIcon width={17} height={17} />
              </Link>
              <Link
                to="/fitting-room"
                className="glass-dark inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em]"
              >
                <CameraIcon width={17} height={17} /> Fitting room
              </Link>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-lg grid-cols-2 gap-3 sm:gap-4">
            <Link to={`/product/${heroWomen.id}`} className="animate-rise mt-10 [animation-delay:150ms]" aria-label={heroWomen.name}>
              <Photo product={heroWomen} className="aspect-[4/5] rounded-t-[999px] rounded-b-2xl" />
            </Link>
            <Link to={`/product/${heroMen.id}`} className="animate-rise [animation-delay:300ms]" aria-label={heroMen.name}>
              <Photo product={heroMen} className="aspect-[4/5] rounded-2xl rounded-bl-[999px]" />
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 py-3 text-[11px] uppercase tracking-[0.3em] text-white/50">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
              <span key={i} className="flex items-center gap-12">
                {t} <span className="text-gold-soft">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured collections */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHead eyebrow="Collections" title="Shop by collection" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
          {[
            { to: '/men', title: 'Men', blurb: 'Tees, polos, hoodies, denim & tailoring', product: menTile },
            { to: '/women', title: 'Women', blurb: 'Dresses, kurtis, co-ords & everyday tops', product: womenTile },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="photo-zoom group relative block overflow-hidden rounded-2xl">
              <div className="photo-bg aspect-[4/5] sm:aspect-[5/6]">
                <img src={asset(c.product.image)} alt={`${c.title} collection`} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-6 pt-24 text-white">
                <h3 className="font-display text-3xl font-medium">{c.title}</h3>
                <p className="mt-1 text-sm text-white/75">{c.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em]">
                  Explore <ArrowRightIcon width={15} height={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <SectionHead eyebrow="Just landed" title="New arrivals" to="/shop" />
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Promo: layering edit */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-sand p-6 sm:p-10 md:grid-cols-[1fr_1.2fr] lg:p-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">The layering edit</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">Pieces that work harder in colder weather</h2>
            <p className="mt-4 max-w-md leading-relaxed text-ink/70">
              Bombers, blazers and relaxed shirts that sit over everything else in your wardrobe.
            </p>
            <Link
              to="/shop?category=Jackets"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-white"
            >
              Shop jackets <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[layer1, layer2, layer3].map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} aria-label={p.name} className="photo-zoom">
                <Photo product={p} className="aspect-[3/5] rounded-xl" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <SectionHead eyebrow="Most loved" title="Best sellers" to="/shop" />
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Featured virtual try-on */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-10 md:grid-cols-2 lg:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/25 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-soft">Virtual fitting room</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">See it on you before you decide</h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/70">
              Take or upload a photo, choose any piece from the catalog and generate a try-on preview with FASHN VTON v1.5, an
              open-source virtual try-on model, once the AI server is connected.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/80">
              <li className="flex gap-2.5"><ShieldIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold-soft" /> Camera starts only when you press the button</li>
              <li className="flex gap-2.5"><ShieldIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold-soft" /> Your photo is sent only after you agree, and is never stored</li>
              <li className="flex gap-2.5"><ShieldIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold-soft" /> Without an AI server the page shows a clearly labeled demo</li>
            </ul>
            <Link
              to={`/fitting-room?product=${tryOnProduct.id}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-soft px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink"
            >
              Open fitting room <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          <div className="relative mx-auto w-full max-w-xs">
            <Photo product={tryOnProduct} className="aspect-[4/5] rounded-2xl" />
            <span className="glass-dark absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
              Product photo
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
