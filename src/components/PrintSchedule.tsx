import { useData } from '@/data/store'
import type { Tournament } from '@/data/types'

/**
 * Print-only schedule (A4, light): hidden on screen, shown by @media print. `window.print()` → "Save as PDF".
 * One block per day; rows time × court; categories colour-coded via a left border; groups and KO listed after.
 */
export function PrintSchedule({ tour }: { tour: Tournament }) {
  const { matches, teamById, categoryById, groups } = useData()
  const ms = matches.filter(m => m.tournamentId === tour.id)
  const days = [...new Set(ms.map(m => m.day))].sort()
  const name = (id?: string, label?: string) => teamById(id)?.name ?? label ?? 'TBD'
  return (
    <div className="print-only">
      <div className="print-head">
        <img src="/img/logo.png" alt="" style={{ height: 54 }} />
        <div>
          <div className="print-title">{tour.name}</div>
          <div className="print-sub">{tour.dates} · {tour.venue}{tour.address ? ` · ${tour.address}` : ''} · {tour.courts} γήπεδα</div>
        </div>
        <div className="print-sub" style={{ marginLeft: 'auto', textAlign: 'right' }}>gnc3on3.gr<br />Πρόγραμμα αγώνων</div>
      </div>
      {days.map(d => {
        const dm = ms.filter(m => m.day === d)
        const times = [...new Set(dm.map(m => m.time))].sort()
        return (
          <div key={d} className="print-day">
            <div className="print-dayhead">{tour.days[d - 1] ?? `Ημέρα ${d}`}</div>
            <table className="print-table">
              <thead><tr><th style={{ width: 52 }}>Ώρα</th>{Array.from({ length: tour.courts }, (_, c) => <th key={c}>Γήπεδο {c + 1}</th>)}</tr></thead>
              <tbody>
                {times.map(t => (
                  <tr key={t}>
                    <td className="print-time">{t}</td>
                    {Array.from({ length: tour.courts }, (_, c) => {
                      const m = dm.find(x => x.time === t && x.court === c + 1)
                      if (!m) return <td key={c} />
                      const cat = categoryById(m.categoryId)
                      return (
                        <td key={c} className={`print-m cat-${cat.key}`}>
                          <div className="print-cat">{cat.short} · {m.label}</div>
                          <div className="print-teams">{name(m.homeId, m.homeLabel)} – {name(m.awayId, m.awayLabel)}</div>
                          {m.status === 'final' && <div className="print-score">{m.homeScore} – {m.awayScore}</div>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      {groups.length > 0 && (
        <div className="print-day">
          <div className="print-dayhead">Όμιλοι</div>
          <div className="print-groups">
            {groups.map(g => (
              <div key={g.id} className="print-group">
                <div className="print-cat">{categoryById(g.categoryId).name} · {g.name}</div>
                {g.rows.map((r, i) => <div key={r.teamId} className="print-row"><span>{i + 1}. {teamById(r.teamId)?.name}</span><span>{r.played ? `${r.wins}–${r.losses}` : ''}</span></div>)}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="print-foot">Κανονισμοί: 4 παίκτες/ομάδα · μισό γήπεδο · μπάλα Νο6 · 10΄ ή πρώτος στους 21 · Οι ομάδες στο γήπεδο 10΄ πριν την ώρα τους. Αλλαγές ανακοινώνονται στη γραμματεία και στο app.</div>
    </div>
  )
}
