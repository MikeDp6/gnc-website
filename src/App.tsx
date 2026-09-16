import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Tournament } from '@/pages/Tournament'
import { Team } from '@/pages/Team'
import { Player } from '@/pages/Player'
import { Placeholder } from '@/pages/Placeholder'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
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
