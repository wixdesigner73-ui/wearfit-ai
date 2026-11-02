import { Link } from 'react-router-dom'
import { asset } from '../config'
import { getProduct } from '../data/products'

export default function About() {
  const a = getProduct('sage-oversized-hoodie')!
  const b = getProduct('floral-co-ord-set')!

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">About</p>
      <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">Everyday clothing, with a smarter way to try it on</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">
        WearFit AI is a fashion e-commerce project exploring how virtual try-on can make online clothes shopping less of a guess.
        It is a demonstration store: the catalog is sample data and nothing can be purchased.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {[a, b].map((p) => (
          <div key={p.id} className="photo-bg aspect-[4/5] overflow-hidden rounded-2xl">
            <img src={asset(p.image)} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-3">
        <section>
          <h2 className="font-display text-xl font-semibold">Honest about AI</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            The fitting room uses FASHN VTON v1.5, an open-source virtual try-on model, through a separate server. When that server
            is not connected the site says so and shows a demo instead. It never presents a fake result as AI.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">Private by design</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Your camera starts only when you press the button. Photos are processed in memory, are not stored on this site, and are
            sent to an AI server only after you give consent.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">A preview, not a fit guarantee</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            A generated image shows an approximate look. It cannot tell you your true size, measurements or how a fabric will
            actually fit. Use the size information on each product page.
          </p>
        </section>
      </div>

      <div className="mt-14 rounded-2xl bg-sand p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Photography</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Product photographs are free-to-use images from{' '}
          <a className="underline" href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>, stored with this site.
          Their photographers and source pages are listed in the repository credits file. The people in the photos are not
          affiliated with this project.
        </p>
        <Link to="/shop" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-white">
          Browse the collection
        </Link>
      </div>
    </div>
  )
}
