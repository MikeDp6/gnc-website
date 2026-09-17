import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Suspense, lazy } from 'react'

// only the home page ships in the first download; every other page is fetched when it is opened
const Tournament = lazy(() => import('@/pages/Tournament').then(m => ({ default: m.Tournament })))
const Team = lazy(() => import('@/pages/Team').then(m => ({ default: m.Team })))
const Player = lazy(() => import('@/pages/Player').then(m => ({ default: m.Player })))
const NewsList = lazy(() => import('@/pages/News').then(m => ({ default: m.NewsList })))
const NewsArticle = lazy(() => import('@/pages/News').then(m => ({ default: m.NewsArticle })))
const Rentals = lazy(() => import('@/pages/Rentals').then(m => ({ default: m.Rentals })))
const Rankings = lazy(() => import('@/pages/Rankings').then(m => ({ default: m.Rankings })))
const Sponsors = lazy(() => import('@/pages/Sponsors').then(m => ({ default: m.Sponsors })))
const Contact = lazy(() => import('@/pages/Contact').then(m => ({ default: m.Contact })))
const Archive = lazy(() => import('@/pages/Archive').then(m => ({ default: m.Archive })))
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })))
const City = lazy(() => import('@/pages/City').then(m => ({ default: m.City })))
const Rules = lazy(() => import('@/pages/Static').then(m => ({ default: m.Rules })))
const About = lazy(() => import('@/pages/Static').then(m => ({ default: m.About })))
const Volunteer = lazy(() => import('@/pages/Static').then(m => ({ default: m.Volunteer })))
const Terms = lazy(() => import('@/pages/Static').then(m => ({ default: m.Terms })))
const Join = lazy(() => import('@/pages/Join').then(m => ({ default: m.Join })))
const PlayerLogin = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })))
const Me = lazy(() => import('@/pages/Me').then(m => ({ default: m.Me })))
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })))
const Live = lazy(() => import('@/pages/Live').then(m => ({ default: m.Live })))

// admin is code-split: visitors never download it
const AdminLayout = lazy(() => import('@/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const Login = lazy(() => import('@/admin/pages/Login').then(m => ({ default: m.Login })))
const Tournaments = lazy(() => import('@/admin/pages/Tournaments').then(m => ({ default: m.Tournaments })))
const TournamentEdit = lazy(() => import('@/admin/pages/TournamentEdit').then(m => ({ default: m.TournamentEdit })))
const Marketing = lazy(() => import('@/admin/pages/Marketing').then(m => ({ default: m.Marketing })))
const Cities = lazy(() => import('@/admin/pages/Cities').then(m => ({ default: m.Cities })))
const Requests = lazy(() => import('@/admin/pages/Requests').then(m => ({ default: m.Requests })))
const AdminNews = lazy(() => import('@/admin/pages/News').then(m => ({ default: m.News })))
const AdminRentals = lazy(() => import('@/admin/pages/Rentals').then(m => ({ default: m.Rentals })))
const Season = lazy(() => import('@/admin/pages/Season').then(m => ({ default: m.Season })))
const Photos = lazy(() => import('@/admin/pages/Photos').then(m => ({ default: m.Photos })))
const fallback = <div className="p-10 text-dim">Φόρτωση…</div>

export default function App() {
  return (
    <Routes>
      <Route path="admin/login" element={<Suspense fallback={fallback}><Login /></Suspense>} />
      <Route path="admin" element={<Suspense fallback={fallback}><AdminLayout /></Suspense>}>
        <Route index element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentEdit />} />
        <Route path="ticker" element={<Marketing />} />
        <Route path="cities" element={<Cities />} />
        <Route path="requests" element={<Requests />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="rentals" element={<AdminRentals />} />
        <Route path="season" element={<Season />} />
        <Route path="photos" element={<Photos />} />
      </Route>
      <Route path="live" element={<Suspense fallback={fallback}><Live /></Suspense>} />
      <Route path="live/:slug" element={<Suspense fallback={fallback}><Live /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tournaments/:slug" element={<Tournament />} />
        <Route path="teams/:id" element={<Team />} />
        <Route path="players/:id" element={<Player />} />
        <Route path="news" element={<NewsList />} />
        <Route path="news/:slug" element={<NewsArticle />} />
        <Route path="rentals" element={<Rentals />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="sponsors" element={<Sponsors />} />
        <Route path="chorigoi" element={<Sponsors />} />
        <Route path="archive" element={<Archive />} />
        <Route path="cities/:id" element={<City />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<PlayerLogin />} />
        <Route path="me" element={<Me />} />
        <Route path="join/:code" element={<Join />} />
        <Route path="contact" element={<Contact />} />
        <Route path="kanonismoi" element={<Rules />} />
        <Route path="about" element={<About />} />
        <Route path="volunteer" element={<Volunteer />} />
        <Route path="oroi" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
