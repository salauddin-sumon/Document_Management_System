import { formatDay } from '../utils/format.js'

// All of a dealer's codes: one row per BU
export default function DealerCodesTable({ codes }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-y border-line">
          <tr>
            <th className="th">Dealer code</th>
            <th className="th">Shop name</th>
            <th className="th">P_N</th>
            <th className="th">BU</th>
            <th className="th">Sales group</th>
            <th className="th">Dist group</th>
            <th className="th">Zone</th>
            <th className="th">Base</th>
            <th className="th">OP date</th>
            <th className="th">Address</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {codes.map((c) => (
            <tr key={c._id || c.dealerCode}>
              <td className="td font-mono font-bold">{c.dealerCode}</td>
              <td className="td font-semibold">{c.shopName || '—'}</td>
              <td className="td">{c.proprietorName || '—'}</td>
              <td className="td">{c.bu}</td>
              <td className="td">{c.salesGroup}</td>
              <td className="td">{c.distGroup || '—'}</td>
              <td className="td text-muted">{c.zone}</td>
              <td className="td text-muted">
                {c.baseName}
                {c.baseId && <span className="block font-mono text-xs text-faint">ID {c.baseId}</span>}
              </td>
              <td className="td whitespace-nowrap text-muted">{formatDay(c.codeOpenDate)}</td>
              <td className="td min-w-48 text-muted">{c.address || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
