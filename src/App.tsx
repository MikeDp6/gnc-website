import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Tournament } from '@/pages/Tournament'
import { Team } from '@/pages/Team'
import { Player } from '@/pages/Player'
import { Placeholder } from '@/pages/Placeholder'
import { NotFound } from '@/pages/NotFound'
import { Suspense, lazy } from 'react'

// admin is code-split: visitors never download it
const AdminLayout = lazy(() => import('@/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const Login = lazy(() => import('@/admin/pages/Login').then(m => ({ default: m.Login })))
const Tournaments = lazy(() => import('@/admin/pages/Tournaments').then(m => ({ default: m.Tournaments })))
const TournamentEdit = lazy(() => import('@/admin/pages/TournamentEdit').then(m => ({ default: m.TournamentEdit })))
const Marketing = lazy(() => import('@/admin/pages/Marketing').then(m => ({ default: m.Marketing })))
const fallback = <div className="p-10 text-dim">Φόρτωση…</div>

export default function App() {
  return (
    <Routes>
      <Route path="admin/login" element={<Suspense fallback={fallback}><Login /></Suspense>} />
      <Route path="admin" element={<Suspense fallback={fallback}><AdminLayout /></Suspense>}>
        <Route index element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentEdit />} />
        <Route path="ticker" element={<Marketing />} />
      </Route>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tournaments/:slug" element={<Tournament />} />
        <Route path="teams/:id" element={<Team />} />
        <Route path="players/:id" element={<Player />} />
        <Route path="archive" element={<Placeholder a="Αρχείο" b="διοργανώσεων" note="Λίστα όλων των διοργανώσεων ανά πόλη και χρονιά, με αποτελέσματα, brackets και φωτογραφίες." />} />
        <Route path="register" element={<Placeholder a="Δήλωση" b="ομάδας" note="Τρία βήματα: διοργάνωση και κατηγορία → όνομα ομάδας και αρχηγός → πρόσκληση συμπαικτών. Συνδέεται με το backend." />} />
        <Route path="contact" element={<Placeholder a="Επικοινωνία" note="Φόρμα επικοινωνίας, social, στοιχεία GNC." />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
