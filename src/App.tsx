import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Tournament } from '@/pages/Tournament'
import { Team } from '@/pages/Team'
import { Player } from '@/pages/Player'
import { Placeholder } from '@/pages/Placeholder'
import { NotFound } from '@/pages/NotFound'
import { AdminLayout } from '@/admin/AdminLayout'
import { Login } from '@/admin/pages/Login'
import { Tournaments } from '@/admin/pages/Tournaments'
import { TournamentEdit } from '@/admin/pages/TournamentEdit'
import { Marketing } from '@/admin/pages/Marketing'

export default function App() {
  return (
    <Routes>
      <Route path="admin/login" element={<Login />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentEdit />} />
        <Route path="ticker" element={<Marketing />} />
      </Route>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tournaments/:slug" element={<Tournament />} />
        <Route path="teams/:id" element={<Team />} />
        <Route path="players/:id" element={<Player />} />
        <Route path="news" element={<Placeholder a="Latest" b="news" note="Όλα τα νέα της GNC: προγράμματα, δηλώσεις, αποτελέσματα, ανακοινώσεις." />} />
        <Route path="news/:slug" element={<Placeholder a="Άρθρο" note="Η σελίδα του άρθρου — συνδέεται με το CMS." />} />
        <Route path="rentals" element={<Placeholder a="Ενοικιάσεις" b="& διοργάνωση" note="Φορητό γήπεδο 3on3, πακέτο διοργάνωσης για δήμους/εταιρείες, scoreboard & ηχητικά, μπασκέτες & μπάλες. Φόρμα αιτήματος προσφοράς." />} />
        <Route path="archive" element={<Placeholder a="Αρχείο" b="διοργανώσεων" note="Λίστα όλων των διοργανώσεων ανά πόλη και χρονιά, με αποτελέσματα, brackets και φωτογραφίες." />} />
        <Route path="register" element={<Placeholder a="Δήλωση" b="ομάδας" note="Τρία βήματα: διοργάνωση και κατηγορία → όνομα ομάδας και αρχηγός → πρόσκληση συμπαικτών. Συνδέεται με το backend." />} />
        <Route path="contact" element={<Placeholder a="Επικοινωνία" note="Φόρμα επικοινωνίας, social, στοιχεία GNC." />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
