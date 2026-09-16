import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Tournament } from '@/pages/Tournament'
import { Team } from '@/pages/Team'
import { Player } from '@/pages/Player'
import { NewsList, NewsArticle } from '@/pages/News'
import { Rentals } from '@/pages/Rentals'
import { Contact } from '@/pages/Contact'
import { Archive } from '@/pages/Archive'
import { Register } from '@/pages/Register'
import { City } from '@/pages/City'
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
        <Route path="news" element={<NewsList />} />
        <Route path="news/:slug" element={<NewsArticle />} />
        <Route path="rentals" element={<Rentals />} />
        <Route path="archive" element={<Archive />} />
        <Route path="cities/:id" element={<City />} />
        <Route path="register" element={<Register />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
