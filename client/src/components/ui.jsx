// Small shared building blocks for the dark, bilingual UI.
import { STATUS } from '../utils/labels.js'

// Bangla caption shown next to an English label: <Bn>খুঁজুন</Bn>
export function Bn({ children }) {
  return <span className="ml-1.5 font-normal text-muted">{children}</span>
}

// Page title row: big English title + Bangla subtitle, with optional buttons on the right
export function PageHeader({ title, bn, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight text-accent">
        {title}
        {bn && <span className="ml-2 align-middle text-lg font-normal text-muted">{bn}</span>}
      </h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

const TONES = {
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-surface-2 text-muted',
}

export function Pill({ tone = 'neutral', children, title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'neutral' }
  return <Pill tone={s.tone}>{s.label}</Pill>
}

export function EmptyState({ title, hint }) {
  return (
    <div className="px-4 py-14 text-center">
      <p className="font-bold text-fg">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}
