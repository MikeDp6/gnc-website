import { Link } from 'react-router-dom'
import { Fragment } from 'react'

export function Crumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <div className="wrap pt-[6px] text-[12px] font-bold uppercase tracking-[.1em] text-dim">
      {items.map((it, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {i === items.length - 1 ? <b className="text-white">{it.label}</b> : it.to ? <Link to={it.to} className="hover:text-white">{it.label}</Link> : it.label}
        </Fragment>
      ))}
    </div>
  )
}
