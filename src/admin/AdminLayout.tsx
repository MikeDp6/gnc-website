import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/cn'

/** Admin shell: guarded, sidebar, no marketing chrome. */
export function AdminLayout() {
  const { session, isAdmin, loading, signOut } = useAuth()
  const { pathname } = useLocation()
  // the screen is used in daylight at the venue as often as at a desk at night
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('gnc-admin-theme') === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => { try { localStorage.setItem('gnc-admin-theme', theme) } catch { /* private mode */ } }, [theme])
  if (loading) return <div className="p-10 text-dim">Έλεγχος σύνδεσης…</div>
  if (!session) return <Navigate to="/admin/login" replace state={{ from: pathname }} />
  if (!isAdmin) return (
    <div className="wrap py-20">
      <div className="card max-w-[560px] p-8">
        <div className="disp mb-3 text-[40px] text-orange">Χωρίς δικαιώματα</div>
        <p className="text-[14px] text-dim">Ο λογαριασμός <b className="text-white">{session.user.email}</b> δεν είναι διαχειριστής. Πρόσθεσέ τον στον πίνακα <code>admins</code>.</p>
        <button onClick={signOut} className="mt-6 text-[13px] font-bold uppercase tracking-[.08em] text-orange">Αποσύνδεση</button>
      </div>
    </div>
  )
  const link = (to: string, label: string, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => cn('block rounded-lg px-3 py-2 text-[13px] font-semibold text-dim hover:text-white', isActive && 'bg-white/8 text-white')}>{label}</NavLink>
  )
  return (
    <div data-admin data-theme={theme} className="grid min-h-screen bg-bg text-ink md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1 border-b border-line p-4 md:border-b-0 md:border-r">
        <Logo className="mb-4" height={48} />
        <div className="kicker mb-1 px-3">Διαχείριση</div>
        {link('/admin', 'Διοργανώσεις', true)}
        {link('/admin/requests', 'Αιτήματα')}
        {link('/admin/cities', 'Πόλεις')}
        {link('/admin/season', 'Ημερολόγιο')}
        {link('/admin/news', 'News')}
        {link('/admin/rentals', 'Ενοικιάσεις')}
        {link('/admin/photos', 'Φωτογραφίες & βίντεο')}
        {link('/admin/ticker', 'Ticker & χορηγοί')}
        <div className="mt-auto px-3 pt-6 text-[12px] text-mute">
          <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="mb-3 flex items-center gap-2 font-bold uppercase tracking-[.08em] text-dim hover:text-white">
            {theme === 'dark' ? '☀' : '☾'} {theme === 'dark' ? 'Φωτεινό' : 'Σκοτεινό'}
          </button>
          <div className="truncate">{session.user.email}</div>
          <button onClick={signOut} className="mt-1 font-bold uppercase tracking-[.08em] text-orange">Αποσύνδεση</button>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-8"><Outlet /></main>
    </div>
  )
}
