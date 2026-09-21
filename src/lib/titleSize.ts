/** Titles are never cut: the longer the title, the smaller the type, and the box grows to fit. */
export function titleSize(t: string, where: 'hero' | 'feature' | 'card') {
  const n = t.length
  if (where === 'hero') return n > 110 ? 'text-[28px] md:text-[48px]' : n > 70 ? 'text-[32px] md:text-[58px]' : 'text-[40px] md:text-[76px]'
  if (where === 'feature') return n > 110 ? 'text-[26px] md:text-[40px]' : n > 70 ? 'text-[30px] md:text-[46px]' : 'text-[38px] md:text-[56px]'
  return n > 90 ? 'text-[22px]' : n > 60 ? 'text-[26px]' : 'text-[30px]'
}
