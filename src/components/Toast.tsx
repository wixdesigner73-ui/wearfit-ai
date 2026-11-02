import { useStore } from '../context/StoreContext'

export default function Toast() {
  const { toast } = useStore()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-8"
    >
      {toast && (
        <div className="animate-rise rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl">{toast}</div>
      )}
    </div>
  )
}
