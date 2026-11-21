import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from './Spinner.jsx'
import IssueLetterForm from './IssueLetterForm.jsx'
import IssueLetterView from './IssueLetterView.jsx'
import { PageHeader, Bn, Pill, EmptyState } from './ui.jsx'
import { formatDay } from '../utils/format.js'

const EMPTY_FILTERS = { bu: '', from: '', to: '' }

// The letters register: filters + table.
// On the Letters page it shows the page header; pass `dealer` to show only that dealer's letters.
export default function IssueLetterList({ dealer }) {
  const { canIssueLetters } = useAuth()
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('') // debounced search
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [options, setOptions] = useState({ bus: [] })
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [formFor, setFormFor] = useState(null) // null = closed, {} = new, letter = edit
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    api.get('/issue-letters/filters').then((res) => setOptions(res.data)).catch(() => {})
  }, [reload])

  useEffect(() => {
    api
      .get('/issue-letters', { params: { search: query, ...filters, page, dealer: dealer?._id } })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errorMessage(err)))
  }, [query, filters, page, dealer, reload])

  const setFilter = (name) => (e) => {
    setFilters({ ...filters, [name]: e.target.value })
    setPage(1)
  }
  const refresh = () => setReload((n) => n + 1)
  const issueButton = canIssueLetters && (
    <button onClick={() => setFormFor({})} className="btn-primary">Issue letter</button>
  )
  const filtered = query || Object.values(filters).some(Boolean)

  return (
    <div className="space-y-5">
      {dealer ? (
        <div className="flex justify-end">{issueButton}</div>
      ) : (
        <PageHeader title="Letters" bn="চিঠি">{issueButton}</PageHeader>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="label" htmlFor="letter-search">Search <Bn>খুঁজুন</Bn></label>
          <input
            id="letter-search"
            className="input"
            placeholder="Ref no, dealer ID / code, owner, issuer, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="letter-bu">BU <Bn>বিজনেস ইউনিট</Bn></label>
          <select id="letter-bu" className="input" value={filters.bu} onChange={setFilter('bu')}>
            <option value="">All BUs</option>
            {options.bus.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="letter-from">From <Bn>হতে</Bn></label>
          <input id="letter-from" type="date" className="input" value={filters.from} max={filters.to || undefined} onChange={setFilter('from')} />
        </div>
        <div>
          <label className="label" htmlFor="letter-to">To <Bn>পর্যন্ত</Bn></label>
          <input id="letter-to" type="date" className="input" value={filters.to} min={filters.from || undefined} onChange={setFilter('to')} />
        </div>
      </div>

      {!data ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="th">Ref no</th>
                  <th className="th">Date</th>
                  <th className="th">BU</th>
                  <th className="th">Dealer code</th>
                  <th className="th">Issued to</th>
                  <th className="th">Note</th>
                  <th className="th">Issued by</th>
                  <th className="th">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.letters.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      {filtered ? (
                        <EmptyState title="No letters match" hint="Clear the search or change the filters." />
                      ) : (
                        <EmptyState title="No letters yet" hint={canIssueLetters ? 'Use "Issue letter" to add the first one.' : undefined} />
                      )}
                    </td>
                  </tr>
                ) : (
                  data.letters.map((l) => (
                    <tr key={l._id} onClick={() => setViewing(l)} className="cursor-pointer transition hover:bg-surface-2">
                      <td className="td align-middle font-mono whitespace-nowrap">{l.referenceNumber}</td>
                      <td className="td align-middle whitespace-nowrap">{formatDay(l.issueDate)}</td>
                      <td className="td align-middle">{l.bu ? <Pill tone="info">{l.bu}</Pill> : <span className="text-muted">—</span>}</td>
                      <td className="td align-middle font-mono font-bold whitespace-nowrap">{l.dealerCode}</td>
                      <td className="td align-middle">
                        <div className="font-semibold">{l.ownerName}</div>
                        <div className="font-mono text-xs text-muted">{l.dealerId}</div>
                      </td>
                      <td className="td max-w-xs align-middle">
                        <p className="line-clamp-2 text-muted" title={l.note}>{l.note}</p>
                      </td>
                      <td className="td align-middle" title={`${l.issuerStaffId} · ${l.designation}`}>{l.issuerName}</td>
                      <td className="td align-middle">
                        {l.attachment ? (
                          // Opens the attached file in a new tab (the auth cookie is sent automatically)
                          <a
                            href={`/api/issue-letters/${l._id}/attachment?inline=1`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn-secondary px-3 py-1.5"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>Showing {data.total} of {data.totalAll} entries</span>
            {data.pages > 1 && (
              <div className="flex items-center gap-2">
                <button className="btn-secondary py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span>Page {data.page} of {data.pages}</span>
                <button className="btn-secondary py-1" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </div>
        </>
      )}

      {viewing && (
        <IssueLetterView
          letterId={viewing._id}
          onClose={() => setViewing(null)}
          onEdit={(letter) => {
            setViewing(null)
            setFormFor(letter)
          }}
          onDeleted={() => {
            setViewing(null)
            refresh()
          }}
        />
      )}

      {formFor && (
        <IssueLetterForm
          letter={formFor._id ? formFor : null}
          presetDealer={dealer}
          onClose={() => setFormFor(null)}
          onSaved={() => {
            setFormFor(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
