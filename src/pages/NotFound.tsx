import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="font-display text-6xl font-semibold text-gold">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-2 text-ink/60">The piece or page you’re looking for doesn’t exist.</p>
      <Link to="/shop" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
        Back to shop
      </Link>
    </div>
  )
}
