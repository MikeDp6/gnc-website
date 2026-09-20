import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Btn, Input, PageTitle, Select, Toast } from '../ui'
import { ImageField } from '../upload'

type Tick = { id: string; tag: string; text: string; text_en: string | null; tone: 'blue' | 'orange'; active: boolean; sort_order: number }
type Sp = { id: string; name: string; url: string | null; logo_url: string | null; active: boolean; sort_order: number }
type Stats = { population: number; spectators: number; base_cities: number; base_players: number }
type NlStats = { total: number; active: number; pending: number; unsubscribed: number; el: number; en: number }
type Campaign = { id: string; subject: string; body: string; lang: 'el' | 'en' | 'all'; status: string; sent_count: number; created_at: string }

export function Marketing() {
  const [ticks, setTicks] = useState<Tick[]>([]); const [sps, setSps] = useState<Sp[]>([])
  const [st, setSt] = useState<Stats | null>(null)
  const [nl, setNl] = useState<NlStats | null>(null)
  const [camps, setCamps] = useState<Campaign[]>([])
  const [draft, setDraft] = useState({ subject: '', body: '', lang: 'el' as 'el' | 'en' | 'all' })
  const [sending, setSending] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const load = useCallback(async () => {
    if (!supabase) return
    const a = await supabase.from('ticker_items').select('*').order('sort_order'); if (a.error) say(a.error.message); else setTicks(a.data as Tick[])
    const b = await supabase.from('sponsors').select('*').order('sort_order'); if (b.error) say(b.error.message); else setSps(b.data as Sp[])
    const c = await supabase.from('counter_base').select('population,spectators,base_cities,base_players').single(); if (!c.error) setSt(c.data as Stats)
    const d = await supabase.from('newsletter_stats').select('*').single(); if (!d.error) setNl(d.data as NlStats)
    const e = await supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }).limit(10); if (!e.error) setCamps(e.data as Campaign[])
  }, [say])
  useEffect(() => { load() }, [load])
  const up = async (table: 'ticker_items' | 'sponsors', id: string, patch: Record<string, unknown>) => { const r = await supabase!.from(table).update(patch).eq('id', id); if (r.error) say(r.error.message); else load() }
  const del = async (table: 'ticker_items' | 'sponsors', id: string) => { if (!confirm('Διαγραφή;')) return; const r = await supabase!.from(table).delete().eq('id', id); if (r.error) say(r.error.message); else load() }
  const [nt, setNt] = useState({ tag: '', text: '', tone: 'blue' as 'blue' | 'orange' })
  const [ns, setNs] = useState('')
  const saveStat = async (patch: Partial<Stats>) => { const r = await supabase!.from('counter_base').update(patch).eq('id', true); if (r.error) say(r.error.message); else { say('Αποθηκεύτηκε'); load() } }
  const addTick = async () => { const r = await supabase!.from('ticker_items').insert({ ...nt, sort_order: ticks.length + 1 }); if (r.error) say(r.error.message); else { setNt({ tag: '', text: '', tone: 'blue' }); load() } }
  const addSp = async () => { const r = await supabase!.from('sponsors').insert({ name: ns, sort_order: sps.length + 1 }); if (r.error) say(r.error.message); else { setNs(''); load() } }
  const saveCampaign = async () => {
    if (!supabase) return
    const { error } = await supabase.from('newsletter_campaigns').insert({ subject: draft.subject.trim(), body: draft.body.trim(), lang: draft.lang })
    if (error) return say(error.message)
    setDraft({ subject: '', body: '', lang: 'el' }); say('Αποθηκεύτηκε ως πρόχειρο'); load()
  }
  const sendBatch = async (id: string) => {
    if (!supabase) return
    setSending(id)
    const { data, error } = await supabase.functions.invoke('newsletter', { body: { action: 'send', campaign: id, limit: 50 } })
    const r = data as { sent?: number; failed?: number; remaining?: number; error?: string } | null
    if (error || r?.error) say(r?.error ?? error!.message)
    else say(`Στάλθηκαν ${r?.sent ?? 0}${r?.failed ? `, απέτυχαν ${r.failed}` : ''}${r?.remaining ? ` · απομένουν ${r.remaining}` : ' · ολοκληρώθηκε'}`)
    setSending(null); load()
  }
  const exportCsv = async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('subscribers').select('email,lang,source,confirmed,confirmed_at,unsubscribed_at,created_at').order('created_at')
    if (error) return say(error.message)
    const rows = (data ?? []) as Array<Record<string, unknown>>
    const head = 'email,lang,source,confirmed,confirmed_at,unsubscribed_at,created_at'
    const csv = [head, ...rows.map(r => head.split(',').map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `gnc-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageTitle a="Ticker" b="& χορηγοί" />
      <div className="card mb-6 p-5">
        <div className="kicker mb-1">Μετρητές αρχικής</div>
        <p className="mb-4 text-[12px] text-dim">
          Οι αριθμοί που κουβαλήσαμε από το παλιό site. Λειτουργούν ως βάση: οι αθλητές και οι πόλεις
          μετρώνται ζωντανά από τη βάση και προστίθενται από πάνω, οι θεατές και η πληθυσμιακή κάλυψη
          γράφονται εδώ με το χέρι μετά από κάθε διοργάνωση.
        </p>
        {st && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([['population', 'Πληθυσμιακή κάλυψη'], ['spectators', 'Θεατές'], ['base_players', 'Αθλητές (βάση)'], ['base_cities', 'Πόλεις (βάση)']] as const).map(([k, label]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[.12em] text-dim">{label}</span>
                <Input type="number" defaultValue={String(st[k])}
                  onBlur={e => Number(e.target.value) !== st[k] && saveStat({ [k]: Number(e.target.value) })} />
              </label>
            ))}
          </div>
        )}
      </div>
      {/* ---------- Newsletter ---------- */}
      <div className="card mb-6 p-5">
        <div className="kicker mb-3">Newsletter</div>
        {nl && (
          <div className="mb-4 flex flex-wrap gap-5 text-[13px]">
            <span><b className="disp mr-2 text-[22px]">{nl.active}</b>ενεργοί</span>
            <span className="text-dim"><b className="mono mr-2 text-[15px] text-white">{nl.pending}</b>εκκρεμεί επιβεβαίωση</span>
            <span className="text-dim"><b className="mono mr-2 text-[15px] text-white">{nl.unsubscribed}</b>διαγραφές</span>
            <span className="text-dim"><b className="mono mr-2 text-[15px] text-white">{nl.el}/{nl.en}</b>ελληνικά / αγγλικά</span>
            <button type="button" onClick={exportCsv} className="ml-auto text-[12px] font-bold uppercase tracking-[.08em] text-orange">↓ Εξαγωγή CSV</button>
          </div>
        )}

        <div className="grid gap-3 border-t border-line pt-4 md:grid-cols-[1fr_140px]">
          <Input placeholder="Θέμα μηνύματος" value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })} />
          <Select value={draft.lang} onChange={e => setDraft({ ...draft, lang: e.target.value as 'el' | 'en' | 'all' })}>
            <option value="el">Ελληνικά</option><option value="en">Αγγλικά</option><option value="all">Όλοι</option>
          </Select>
          <textarea rows={6} placeholder="Το κείμενο. Άφησε κενή γραμμή ανάμεσα στις παραγράφους."
            value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })}
            className="w-full rounded-[12px] border border-line bg-black/25 px-3 py-2 text-[14px] outline-none md:col-span-2" />
          <div className="md:col-span-2">
            <Btn variant="ghost" onClick={saveCampaign} disabled={!draft.subject.trim() || !draft.body.trim()}>Αποθήκευση ως πρόχειρο</Btn>
          </div>
        </div>

        {camps.length > 0 && (
          <div className="mt-5 border-t border-line pt-3">
            {camps.map(c => (
              <div key={c.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-line py-2 text-[13px] first:border-t-0">
                <span className="truncate"><b>{c.subject}</b><small className="ml-2 text-dim">{c.lang} · {new Date(c.created_at).toLocaleDateString('el-GR')}</small></span>
                <span className="mono text-dim">{c.sent_count} στάλθηκαν{c.status === 'sent' ? ' · ολοκληρώθηκε' : ''}</span>
                {c.status !== 'sent' && (
                  <Btn variant="orange" disabled={!!sending} onClick={() => sendBatch(c.id)}>
                    {sending === c.id ? 'Αποστολή…' : c.sent_count ? 'Συνέχεια' : 'Αποστολή'}
                  </Btn>
                )}
              </div>
            ))}
            <p className="mt-3 text-[12px] text-mute">Η αποστολή γίνεται σε παρτίδες των 50, γιατί το δωρεάν Resend δίνει 100 μηνύματα την ημέρα. Πάτα «Συνέχεια» για την επόμενη παρτίδα.</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="kicker mb-3">Ticker (η λωρίδα πάνω-πάνω)</div>
          {ticks.map(t => (
            <div key={t.id} className="grid grid-cols-[90px_1fr_auto_auto_auto] items-center gap-2 border-t border-line py-2 text-[13px]">
              <Input value={t.tag} onChange={e => up('ticker_items', t.id, { tag: e.target.value })} className="py-1" />
              <Input value={t.text} onChange={e => up('ticker_items', t.id, { text: e.target.value })} className="py-1" />
              <Select value={t.tone} onChange={e => up('ticker_items', t.id, { tone: e.target.value })} className="w-[100px] py-1"><option value="blue">Μπλε</option><option value="orange">Πορτοκαλί</option></Select>
              <input type="checkbox" checked={t.active} onChange={e => up('ticker_items', t.id, { active: e.target.checked })} title="Ενεργό" />
              <button onClick={() => del('ticker_items', t.id)} className="text-mute hover:text-red">✕</button>
            </div>
          ))}
          <div className="mt-4 grid grid-cols-[90px_1fr_auto_auto] gap-2 border-t border-line pt-4">
            <Input placeholder="ΕΠΟΜΕΝΟ" value={nt.tag} onChange={e => setNt({ ...nt, tag: e.target.value })} className="py-1" />
            <Input placeholder="Κείμενο" value={nt.text} onChange={e => setNt({ ...nt, text: e.target.value })} className="py-1" />
            <Select value={nt.tone} onChange={e => setNt({ ...nt, tone: e.target.value as 'blue' | 'orange' })} className="w-[100px] py-1"><option value="blue">Μπλε</option><option value="orange">Πορτοκαλί</option></Select>
            <Btn onClick={addTick} className="py-1">+</Btn>
          </div>
        </div>
        <div className="card p-5">
          <div className="kicker mb-3">Χορηγοί</div>
          {sps.map(s => (
            <div key={s.id} className="grid gap-3 border-t border-line py-3 text-[13px] md:grid-cols-[1fr_1fr]">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Input value={s.name} onChange={e => up('sponsors', s.id, { name: e.target.value })} className="py-1 font-bold" />
                  <input type="checkbox" checked={s.active} onChange={e => up('sponsors', s.id, { active: e.target.checked })} title="Ενεργός" />
                  <button onClick={() => del('sponsors', s.id)} className="text-mute hover:text-red">✕</button>
                </div>
                <Input value={s.url ?? ''} placeholder="https://… (site χορηγού)" onChange={e => up('sponsors', s.id, { url: e.target.value || null })} className="py-1 text-[12px]" />
              </div>
              <ImageField value={s.logo_url} onChange={v => up('sponsors', s.id, { logo_url: v })} folder="sponsors" label="" aspect="aspect-[3/1]" />
            </div>
          ))}
          <div className="mt-4 flex gap-2 border-t border-line pt-4"><Input placeholder="Όνομα χορηγού" value={ns} onChange={e => setNs(e.target.value)} className="py-1" /><Btn onClick={addSp} className="py-1">+</Btn></div>
          <div className="mt-3 text-[12px] text-mute">Λογότυπο: PNG με διαφάνεια, λευκό ή ανοιχτόχρωμο (εμφανίζεται πάνω σε σκούρο φόντο), ~400×130 px. Χωρίς λογότυπο εμφανίζεται το όνομα.</div>
        </div>
      </div>
      <Toast msg={toast} />
    </>
  )
}
