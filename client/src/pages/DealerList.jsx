import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'
import DealerCodesTable from '../components/DealerCodesTable.jsx'
import { PageHeader, Bn, StatusBadge, EmptyState } from '../components/ui.jsx'
import { STATUS } from '../utils/labels.js'

// Shown above the table when the search is exactly a dealer ID: everything about that dealer
function DealerProfile({ dealer }) {
  return (
    <section className="overflow-hidden rounded-xl border border-accent/50 bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-bold text-accent">{dealer.dealerId}</span>
            <h2 className="text-2xl font-bold">{dealer.ownerName}</h2>
            <StatusBadge status={dealer.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Mobile {dealer.mobile} · NID {dealer.nidNumber} · Trade license {dealer.tradeLicense} ·{' '}
            {dealer.codes.length} code{dealer.codes.length !== 1 && 's'} in{' '}
            {[...new Set(dealer.codes.map((c) => c.bu))].join(', ')}
          </p>
        </div>
        <Link to={`/dealers/${dealer._id}`} className="btn-primary">Open full profile</Link>
      </div>
      <DealerCodesTable codes={dealer.codes} />
    </section>
  )
}

export default function DealerList() {
  const navigate = useNavigate()
  const { canAddDealers } = useAuth()
  // Filters live in the URL so they survive refresh and the back button
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const zone = params.get('zone') || ''
  const status = params.get('status') || ''
  const bu = params.get('bu') || ''
  const page = Number(params.get('page')) || 1

  const [searchInput, setSearchInput] = useState(search)
  const [data, setData] = useState(null)
  const [meta, setMeta] = useState({ zones: [], bus: [] })

  const updateParams = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) updateParams({ search: searchInput })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    api.get('/dealers/meta').then((res) => setMeta(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    api
      .get('/dealers', { params: { search, zone, bu, status, page } })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errorMessage(err)))
  }, [search, zone, bu, status, page])

  const exact = data?.dealers.find((d) => d.dealerId === search.trim().toUpperCase())

  return (
    <div className="space-y-5">
      <PageHeader title="Dealers" bn="ডিলার তালিকা">
        {canAddDealers && <Link to="/dealers/new" className="btn-primary">Add dealer</Link>}
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="label" htmlFor="search">Search <Bn>খুঁজুন</Bn></label>
          <input
            id="search"
            className="input"
            placeholder="Dealer ID, code, owner, mobile, NID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="zone">Zone <Bn>জোন</Bn></label>
          <select id="zone" className="input" value={zone} onChange={(e) => updateParams({ zone: e.target.value })}>
            <option value="">All zones</option>
            {meta.zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">Status <Bn>অবস্থা</Bn></label>
          <select id="status" className="input" value={status} onChange={(e) => updateParams({ status: e.target.value })}>
            <option value="">All statuses</option>
            {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="bu">BU <Bn>বিজনেস ইউনিট</Bn></label>
          <select id="bu" className="input" value={bu} onChange={(e) => updateParams({ bu: e.target.value })}>
            <option value="">All BUs</option>
            {meta.bus.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {!data ? (
        <Spinner />
      ) : exact ? (
        <DealerProfile dealer={exact} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className="th">Dealer ID</th>
                  <th className="th">Codes</th>
                  <th className="th">Dealer</th>
                  <th className="th">Zone</th>
                  <th className="th">Status</th>
                  <th className="th">NID / Trade license</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.dealers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      {data.totalAll === 0 ? (
                        <EmptyState
                          title="No dealers yet"
                          hint={canAddDealers ? 'Use "Add dealer" to add the first one.' : 'An admin or Back Office user needs to add dealers.'}
                        />
                      ) : (
                        <EmptyState title="No dealers match" hint="Clear the search or change the filters." />
                      )}
                    </td>
                  </tr>
                ) : (
                  data.dealers.map((d) => (
                    <tr
                      key={d._id}
                      onClick={() => navigate(`/dealers/${d._id}`)}
                      className="cursor-pointer transition hover:bg-surface-2"
                    >
                      <td className="td font-mono font-bold whitespace-nowrap text-accent">{d.dealerId}</td>
                      <td className="td">
                        {/* One line per dealer code (one per BU) */}
                        {d.codes.map((c) => (
                          <div key={c._id} className="whitespace-nowrap">
                            <span className="font-mono font-bold text-fg">{c.dealerCode}</span>
                            <span className="ml-2 text-xs text-muted">BU {c.bu}</span>
                          </div>
                        ))}
                      </td>
                      <td className="td">
                        <div className="font-semibold text-fg">{d.ownerName}</div>
                        <div className="text-xs text-muted">{d.mobile}</div>
                      </td>
                      <td className="td text-muted">{[...new Set(d.codes.map((c) => c.zone))].join(', ')}</td>
                      <td className="td"><StatusBadge status={d.status} /></td>
                      <td className="td">
                        <div className="font-mono text-sm">{d.nidNumber}</div>
                        <div className="font-mono text-xs text-muted">{d.tradeLicense}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>Showing {data.total} of {data.totalAll} dealers</span>
            {data.pages > 1 && (
              <div className="flex items-center gap-2">
                <button className="btn-secondary py-1" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
                  Prev
                </button>
                <span>Page {data.page} of {data.pages}</span>
                <button className="btn-secondary py-1" disabled={page >= data.pages} onClick={() => updateParams({ page: String(page + 1) })}>
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
