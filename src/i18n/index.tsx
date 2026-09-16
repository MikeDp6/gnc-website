import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { el, type Dict } from './el'
import { en } from './en'

export type Lang = 'el' | 'en'
const dicts: Record<Lang, Dict> = { el, en }

interface I18n { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const Ctx = createContext<I18n>({ lang: 'el', t: el, setLang: () => {} })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('gnc-lang') as Lang) || 'el' } catch { return 'el' }
  })
  const value = useMemo<I18n>(() => ({
    lang, t: dicts[lang],
    setLang: (l) => { setLangState(l); try { localStorage.setItem('gnc-lang', l) } catch { /* ignore */ } document.documentElement.lang = l },
  }), [lang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useI18n = () => useContext(Ctx)
