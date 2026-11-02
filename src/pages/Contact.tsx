import { useState } from 'react'
import { CONTACT_EMAIL, CONTACT_EMAIL_IS_PLACEHOLDER } from '../config'

/**
 * There is no backend, so this form does not "send" anything. It opens the visitor's own email app with a
 * pre-filled message (mailto:). The page states this plainly rather than pretending a message was delivered.
 */
export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`WearFit AI enquiry from ${name || 'a visitor'}`)}&body=${encodeURIComponent(
    `${message}\n\nFrom: ${name}${email ? ` <${email}>` : ''}`,
  )}`

  const field = 'mt-1.5 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-ink'

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Contact</p>
      <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Get in touch</h1>
      <p className="mt-4 max-w-xl text-ink/70">
        Questions about the project or the fitting room? Write your message below and it will open in your email app, ready to
        send to <strong>{CONTACT_EMAIL}</strong>.
      </p>

      {CONTACT_EMAIL_IS_PLACEHOLDER && (
        <p role="note" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          The site owner has not configured a contact address yet (set <code>VITE_CONTACT_EMAIL</code> when building), so this form
          currently points at a placeholder.
        </p>
      )}

      <form
        className="mt-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          window.location.href = mailto
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Name
            <input required value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" />
          </label>
          <label className="block text-sm font-medium">
            Your email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Message
          <textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className={field} />
        </label>
        <button type="submit" className="rounded-full bg-ink px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white">
          Open in email app
        </button>
        <p className="text-xs text-ink/50">This site has no server, so nothing is sent until you press send in your email app.</p>
      </form>
    </div>
  )
}
