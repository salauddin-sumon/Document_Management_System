import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'
import DealerCodesTable from '../components/DealerCodesTable.jsx'
import IssueLetterList from '../components/IssueLetterList.jsx'
import NoticeSection from '../components/NoticeSection.jsx'
import DocumentSection from '../components/DocumentSection.jsx'
import { Bn, StatusBadge } from '../components/ui.jsx'
import { formatDate, displayName } from '../utils/format.js'

const TABS = [
  { key: 'letters', label: 'Issue letters', bn: 'চিঠি' },
  { key: 'notices', label: 'Notices', bn: 'নোটিশ' },
  { key: 'files', label: 'Other files', bn: 'অন্যান্য ফাইল' },
]

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-fg">{value || '—'}</dd>
    </div>
  )
}

export default function DealerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [dealer, setDealer] = useState(null)
  const [tab, setTab] = useState(TABS[0].key)

  useEffect(() => {
    api
      .get(`/dealers/${id}`)
      .then((res) => setDealer(res.data))
      .catch((err) => {
        toast.error(errorMessage(err))
        navigate('/dealers')
      })
  }, [id, navigate])

  const handleDelete = async () => {
    if (!confirm(`Delete dealer ${dealer.dealerId} (${dealer.ownerName}) and all ${dealer.codes.length} code(s)? Notices and other files are removed. Issue letters are kept.`)) return
    try {
      await api.delete(`/dealers/${id}`)
      toast.success('Dealer deleted')
      navigate('/dealers')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (!dealer) return <Spinner />

  const bus = [...new Set(dealer.codes.map((c) => c.bu))]

  return (
    <div className="space-y-6">
      <Link to="/dealers" className="text-sm text-muted hover:text-fg">← All dealers</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-bold text-accent">{dealer.dealerId}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{dealer.ownerName}</h1>
            <StatusBadge status={dealer.status} />
          </div>
          <p className="mt-1 text-muted">
            {dealer.codes.length} dealer code{dealer.codes.length !== 1 && 's'} · BU {bus.join(', ')} ·{' '}
            {dealer.letterCount} letter{dealer.letterCount !== 1 && 's'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {/* Opens Add dealer with this owner's details filled in; same NID + TL → code is added here */}
            <Link to={`/dealers/new?dealer=${id}`} className="btn-primary">Add new code</Link>
            <Link to={`/dealers/${id}/edit`} className="btn-secondary">Edit</Link>
            <button onClick={handleDelete} className="btn-danger">Delete</button>
          </div>
        )}
      </div>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">Owner details <Bn>মালিকের তথ্য</Bn></h2>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Field label="Dealer ID" value={dealer.dealerId} />
          <Field label="Mobile" value={dealer.mobile} />
          <Field label="NID number" value={dealer.nidNumber} />
          <Field label="Trade license" value={dealer.tradeLicense} />
          <Field
            label="Added"
            value={`${formatDate(dealer.createdAt)}${dealer.createdBy ? ` · ${displayName(dealer.createdBy)}` : ''}`}
          />
        </dl>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <h2 className="px-5 pt-5 pb-3 text-lg font-bold">Dealer codes <Bn>ডিলার কোড</Bn></h2>
        <DealerCodesTable codes={dealer.codes} />
      </section>

      <div>
        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${
                tab === t.key ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'
              }`}
            >
              {t.label} <span className="font-normal text-muted">{t.bn}</span>
            </button>
          ))}
        </div>
        {tab === 'letters' && <IssueLetterList dealer={dealer} />}
        {tab === 'notices' && <NoticeSection dealerId={id} />}
        {tab === 'files' && <DocumentSection dealerId={id} />}
      </div>
    </div>
  )
}
