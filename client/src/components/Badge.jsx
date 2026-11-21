import { Pill } from './ui.jsx'

const TONE = {
  low: 'neutral',
  medium: 'warn',
  high: 'danger',
  admin: 'info',
  zm_hos: 'ok',
  staff: 'neutral',
}

// value picks the colour; label (optional) is the text shown
export default function Badge({ value, label }) {
  return <Pill tone={TONE[value]}>{label || value.charAt(0).toUpperCase() + value.slice(1)}</Pill>
}
