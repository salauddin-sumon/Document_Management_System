import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'
import IssueLetterForm from '../components/IssueLetterForm.jsx'
import { PageHeader, Pill, StatusBadge } from '../components/ui.jsx'
import { formatDay, formatDate } from '../utils/format.js'

// tone colours the number: green for active, red for closed…
const NUMBER_TONE = { accent: 'text-accent', ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' }

function StatCard({ label, bn, value, to, tone = 'accent' }) {
  return (
    <Link to={to} className="card block transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md">
      <p className="text-sm font-semibold text-fg">{label}</p>
      <p className="text-sm text-muted">{bn}</p>
      <p className={`mt-3 font-mono text-4xl font-extrabold ${NUMBER_TONE[tone]}`}>{value}</p>
    </Link>
  )
}

function Panel({ title, bn, right, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3">
        <h2 className="text-lg font-bold text-accent">
          {title} <span className="ml-1 text-base font-normal text-muted">{bn}</span>
        </h2>
        {right}
      </div>
      <div className="px-5 py-3">{children}</div>
    </section>
  )
}

export default function Dashboard() {
  const { isAdmin, canIssueLetters } = useAuth()
  const [stats, setStats] = useState(null)
  const [issuing, setIssuing] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => toast.error(errorMessage(err)))
  }, [reload])

  if (!stats) return <Spinner />

  const { totalDealers, totalCodes, byStatus, year, lettersThisYear, recentLetters, recentDealers } = stats

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" bn="সারসংক্ষেপ">
        {canIssueLetters && (
          <button onClick={() => setIssuing(true)} className="btn-secondary">Issue letter</button>
        )}
        {isAdmin && <Link to="/dealers/new" className="btn-primary">Add dealer</Link>}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Dealers" bn="মোট ডিলার" value={totalDealers} to="/dealers" />
        <StatCard label="Dealer codes" bn="মোট ডিলার কোড" value={totalCodes} to="/dealers" />
        <StatCard label="Active" bn="সক্রিয়" value={byStatus.active} to="/dealers?status=active" tone="ok" />
        <StatCard label="Suspended" bn="স্থগিত" value={byStatus.suspended} to="/dealers?status=suspended" tone="warn" />
        <StatCard label="Closed" bn="বন্ধ" value={byStatus.closed} to="/dealers?status=closed" tone="danger" />
        <StatCard label={`Letters in ${year}`} bn="এ বছরের চিঠি" value={lettersThisYear} to="/issue-letters" tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Recent letters"
          bn="সাম্প্রতিক চিঠি"
          right={<Link to="/issue-letters" className="btn-secondary px-3 py-1">See all</Link>}
        >
          {recentLetters.length === 0 ? (
            <p className="py-2 text-muted">No letters issued yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentLetters.map((l) => (
                <li key={l._id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-fg">
                      {l.ownerName} <span className="font-mono font-normal text-muted">({l.dealerCode})</span>
                    </p>
                    <p className="truncate text-sm text-muted">
                      <span className="font-mono">{l.referenceNumber}</span> · {formatDay(l.issueDate)} · {l.note}
                    </p>
                  </div>
                  {l.bu && <Pill tone="danger">BU {l.bu}</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recently updated dealers"
          bn="সাম্প্রতিক ডিলার"
          right={<Link to="/dealers" className="btn-secondary px-3 py-1">See all</Link>}
        >
          {recentDealers.length === 0 ? (
            <p className="py-2 text-muted">No dealers yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentDealers.map((d) => (
                <li key={d._id}>
                  <Link to={`/dealers/${d._id}`} className="flex items-start justify-between gap-3 py-3 hover:text-accent">
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {d.ownerName} <span className="ml-1 font-mono text-sm text-accent">{d.dealerId}</span>
                      </p>
                      <p className="truncate font-mono text-sm text-muted">
                        {d.codes.map((c) => `${c.dealerCode} (BU ${c.bu})`).join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={d.status} />
                      <p className="mt-1 text-xs text-faint">{formatDate(d.updatedAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {issuing && (
        <IssueLetterForm
          onClose={() => setIssuing(false)}
          onSaved={() => {
            setIssuing(false)
            setReload((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}
