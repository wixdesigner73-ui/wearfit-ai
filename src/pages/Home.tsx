import { Link } from 'react-router-dom'
import GarmentArt from '../components/GarmentArt'
import { ArrowRightIcon, CameraIcon, SparkleIcon } from '../components/Icons'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, PRODUCTS, getProduct } from '../data/products'

const MARQUEE = ['New season', 'Organic cotton', 'Garment dyed', 'Everyday luxury', 'Try before you buy*', 'Free returns']

export default function Home() {
  const featured = PRODUCTS.filter((p) => p.badge === 'Bestseller' || p.badge === 'New').slice(0, 4)
  const hoodie = getProduct('drift-hoodie')!
  const dress = getProduct('solene-dress')!
  const jacket = getProduct('harbor-jacket')!

  return (
    <div>
      {/* Hero */}
      <section className="bg-aurora grain relative isolate overflow-hidden text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-28">
          <div className="animate-rise">
            <span className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
              <SparkleIcon width={14} height={14} className="text-gold-soft" /> Autumn / Winter collection
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              Wear it first.
              <br />
              <span className="text-gold-soft">Love it longer.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-white/75 sm:text-lg">
              Refined essentials in honest fabrics — plus a virtual fitting room demo to preview garments on your own photo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                Shop the collection <ArrowRightIcon width={18} height={18} />
              </Link>
              <Link
                to="/fitting-room"
                className="glass-dark inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                <CameraIcon width={18} height={18} /> Try the fitting room
              </Link>
            </div>
          </div>

          {/* Floating garment composition (pure CSS/SVG) */}
          <div className="relative mx-auto h-80 w-full max-w-md sm:h-[28rem]" aria-hidden="true">
            <div className="absolute inset-6 rounded-full bg-gold-soft/10 blur-3xl" />
            <GarmentArt type="jacket" color={jacket.colors[0].hex} className="absolute left-0 top-6 h-56 animate-float sm:h-72" />
            <GarmentArt
              type="dress"
              color={dress.colors[0].hex}
              className="absolute right-4 top-0 h-60 animate-float [animation-delay:-2s] sm:h-80"
            />
            <GarmentArt
              type="hoodie"
              color={hoodie.colors[3].hex}
              className="absolute bottom-0 left-1/3 h-48 animate-float [animation-delay:-4s] sm:h-64"
            />
          </div>
        </div>

        {/* Marquee */}
        <div className="border-y border-white/10 py-3 text-xs uppercase tracking-[0.25em] text-white/60">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
              <span key={i} className="flex items-center gap-12">
                {t} <span className="text-gold-soft">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Shop by category</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const sample = PRODUCTS.find((p) => p.category === cat.id)!
            return (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.id}`}
                className="studio shine group relative aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <GarmentArt
                  type={sample.garment}
                  color={sample.colors[0].hex}
                  className="absolute inset-0 m-auto h-[62%] transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-12 text-white">
                  <h3 className="font-display text-xl font-semibold">{cat.label}</h3>
                  <p className="hidden text-xs text-white/70 sm:block">{cat.blurb}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Fresh & favourite</h2>
          <Link to="/shop" className="text-sm font-semibold underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Fitting room promo */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-white sm:px-12 sm:py-16">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-gold/30 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-soft">
                Demo mode
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">The virtual fitting room</h2>
              <p className="mt-3 max-w-lg text-white/70">
                Snap a photo or upload one, pick a garment and drag it into place. Everything runs privately in your browser.
                This is a visual overlay — a true AI try-on model is not connected yet.
              </p>
              <Link
                to="/fitting-room"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white"
              >
                Open fitting room <ArrowRightIcon width={18} height={18} />
              </Link>
            </div>
            <div className="hidden justify-center md:flex" aria-hidden="true">
              <GarmentArt type="hoodie" color={hoodie.colors[1].hex} className="h-56 animate-float" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
