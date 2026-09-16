import { Link } from 'react-router-dom'
export function NotFound() {
  return (
    <div className="wrap py-[120px] text-center">
      <div className="disp text-[120px] text-orange">404</div>
      <p className="text-dim">Η σελίδα δεν βρέθηκε.</p>
      <Link to="/" className="mt-6 inline-block text-orange">← Αρχική</Link>
    </div>
  )
}
