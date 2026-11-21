import { useState } from 'react'

const MAX_SHOWN = 8

// Dealer code box with our own suggestion list (instead of the browser's <datalist>,
// whose matching is unreliable). Matches anywhere in the dealer code, Dealer ID or owner name.
// codes: [{ dealerCode, dealerId, ownerName, bu, salesGroup }]
export default function DealerCodeInput({ codes, value, onChange, required }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // highlighted suggestion (arrow keys)

  const q = value.trim().toUpperCase()
  const matches = codes
    .filter(
      (c) =>
        !q ||
        c.dealerCode.includes(q) ||
        c.dealerId?.toUpperCase().includes(q) ||
        c.ownerName?.toUpperCase().includes(q)
    )
    // codes that START with what was typed come first
    .sort((a, b) => Number(b.dealerCode.startsWith(q)) - Number(a.dealerCode.startsWith(q)))
    .slice(0, MAX_SHOWN)

  const exact = codes.some((c) => c.dealerCode === q)
  const showList = open && matches.length > 0 && !(exact && matches.length === 1)

  const choose = (c) => {
    onChange(c.dealerCode)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter') {
      e.preventDefault() // pick the suggestion instead of submitting the form
      choose(matches[active] || matches[0])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <input
        className="input font-mono"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder="Type code, Dealer ID or owner"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        required={required}
      />
      {showList && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {matches.map((c, i) => (
            <li
              key={c.dealerCode}
              role="option"
              aria-selected={i === active}
              // onMouseDown (not onClick) so it fires before the input loses focus
              onMouseDown={(e) => {
                e.preventDefault()
                choose(c)
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? 'bg-surface-2' : ''}`}
            >
              <div className="font-mono font-bold text-fg">{c.dealerCode}</div>
              <div className="text-xs text-muted">
                <span className="font-mono text-accent">{c.dealerId}</span> · {c.ownerName} · BU {c.bu} · {c.salesGroup}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
