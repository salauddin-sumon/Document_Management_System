import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import { PageHeader, Bn } from '../components/ui.jsx'
import { STATUS } from '../utils/labels.js'
import { toDateInput } from '../utils/format.js'

// Stored once per dealer (the person)
const OWNER_FIELDS = [
  { name: 'ownerName', label: 'Owner name', bn: 'মালিকের নাম' },
  { name: 'mobile', label: 'Mobile number', bn: 'মোবাইল', type: 'tel' },
  { name: 'nidNumber', label: 'NID number', bn: 'এনআইডি নম্বর' },
  { name: 'tradeLicense', label: 'Trade license', bn: 'ট্রেড লাইসেন্স' },
]

// Stored per dealer code (one per BU)
const CODE_FIELDS = [
  { name: 'dealerCode', label: 'Dealer code', bn: 'ডিলার কোড', mono: true },
  { name: 'bu', label: 'BU', bn: 'বিজনেস ইউনিট', list: 'bus' },
  { name: 'salesGroup', label: 'Sales group', bn: 'সেলস গ্রুপ', list: 'salesGroups' },
  { name: 'zone', label: 'Zone', bn: 'জোন', list: 'zones' },
  { name: 'baseName', label: 'Base name', bn: 'বেস', list: 'baseNames' },
  { name: 'codeOpenDate', label: 'Code open date', bn: 'কোড খোলার তারিখ', type: 'date' },
]

const emptyOf = (fields) => Object.fromEntries(fields.map((f) => [f.name, '']))

function TextField({ field, value, onChange, disabled }) {
  return (
    <div>
      <label className="label" htmlFor={field.name}>{field.label} * <Bn>{field.bn}</Bn></label>
      <input
        id={field.name}
        type={field.type || 'text'}
        list={field.list}
        className={`input ${field.mono ? 'font-mono' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
      />
    </div>
  )
}

// /dealers/new          → Add dealer: owner details + ONE dealer code
// /dealers/new?dealer=… → same, with the owner details filled in from that dealer
// /dealers/:id/edit     → Edit dealer: owner details, status and the existing codes
export default function DealerForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [owner, setOwner] = useState(emptyOf(OWNER_FIELDS))
  const [code, setCode] = useState(emptyOf(CODE_FIELDS)) // add mode
  const [status, setStatus] = useState('active') // edit mode
  const [codes, setCodes] = useState([]) // edit mode
  const [dealerId, setDealerId] = useState('')
  const [matches, setMatches] = useState([]) // existing dealers sharing this NID or trade license
  const [asking, setAsking] = useState(false) // the "keep dealer ID or create new?" question is open
  const [loading, setLoading] = useState(isEdit || params.has('dealer'))
  const [saving, setSaving] = useState(false)
  const [meta, setMeta] = useState({ zones: [], bus: [], salesGroups: [], baseNames: [] })

  useEffect(() => {
    // Existing values are suggested while typing
    api.get('/dealers/meta').then((res) => setMeta(res.data)).catch(() => {})
    const sourceId = id || params.get('dealer')
    if (!sourceId) return
    api
      .get(`/dealers/${sourceId}`)
      .then(({ data: d }) => {
        setOwner(Object.fromEntries(OWNER_FIELDS.map((f) => [f.name, d[f.name] ?? ''])))
        setDealerId(d.dealerId)
        setStatus(d.status)
        setCodes(d.codes.map((c) => ({ ...c, codeOpenDate: toDateInput(c.codeOpenDate) })))
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, params])

  // Add mode: as NID / trade license are typed, check whether either already belongs to a dealer
  const { nidNumber, tradeLicense } = owner
  useEffect(() => {
    if (isEdit) return
    const t = setTimeout(() => {
      if (!nidNumber.trim() && !tradeLicense.trim()) return setMatches([])
      api
        .get('/dealers/lookup', { params: { nidNumber, tradeLicense } })
        .then((res) => {
          setMatches(res.data.matches)
          // Same NID and trade license = same person: fill in name/mobile if not typed yet
          const exact = res.data.matches.find((m) => m.exact)
          if (exact) {
            setOwner((o) => ({ ...o, ownerName: o.ownerName || exact.ownerName, mobile: o.mobile || exact.mobile }))
          }
        })
        .catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [isEdit, nidNumber, tradeLicense])

  const setOwnerField = (name) => (e) => setOwner({ ...owner, [name]: e.target.value })
  const setCodeField = (name) => (e) => setCode({ ...code, [name]: e.target.value })
  const setCodesField = (index, name) => (e) =>
    setCodes(codes.map((c, i) => (i === index ? { ...c, [name]: e.target.value } : c)))

  // Add mode: send the form with the user's answer
  // choice = { addToDealer: <dealer _id> } or { createNew: true } or {} (no match found)
  const saveNew = async (choice) => {
    setSaving(true)
    try {
      const res = await api.post('/dealers', { ...owner, ...code, ...choice })
      setAsking(false)
      toast.success(
        res.data.addedToExisting
          ? `Code ${code.dealerCode.toUpperCase()} added to existing dealer ${res.data.dealerId}`
          : `New dealer ${res.data.dealerId} created`,
        { duration: 5000 }
      )
      navigate(`/dealers/${res.data._id}`)
    } catch (err) {
      // 409 = the server found a matching dealer the form didn't know about yet: ask
      if (err.response?.status === 409) {
        setMatches(err.response.data.matches)
        setAsking(true)
      } else {
        toast.error(errorMessage(err))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEdit) {
      // NID or trade license already used by a dealer → ask before saving
      if (matches.length) return setAsking(true)
      return saveNew({})
    }
    setSaving(true)
    try {
      const res = await api.put(`/dealers/${id}`, { ...owner, status, codes })
      toast.success('Dealer updated')
      navigate(`/dealers/${res.data._id}`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const hasExact = matches.some((m) => m.exact)
  const matchedText = (m) =>
    m.exact ? 'NID number and trade license' : m.matchedOn.nidNumber ? 'NID number' : 'trade license'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={isEdit ? `Edit dealer ${dealerId}` : 'Add dealer'}
        bn={isEdit ? 'ডিলার সম্পাদনা' : 'নতুন ডিলার / নতুন কোড'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card space-y-4">
          <h2 className="text-lg font-bold">Owner details <Bn>মালিকের তথ্য</Bn></h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OWNER_FIELDS.map((f) => (
              <TextField key={f.name} field={f} value={owner[f.name]} onChange={setOwnerField(f.name)} />
            ))}
            {isEdit && (
              <div>
                <label className="label" htmlFor="status">Status <Bn>অবস্থা</Bn></label>
                <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {!isEdit && matches.length > 0 && (
            <div className="rounded-lg border border-ok/40 bg-ok-bg px-4 py-3 text-sm">
              <p className="font-bold text-ok">Already a dealer</p>
              <ul className="mt-1 space-y-0.5 text-fg">
                {matches.map((m) => (
                  <li key={m._id}>
                    <span className="font-mono font-bold">{m.dealerId}</span> · {m.ownerName} has the same{' '}
                    {matchedText(m)} · codes{' '}
                    <span className="font-mono">{m.codes.map((c) => `${c.dealerCode} (BU ${c.bu})`).join(', ')}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-muted">When you save, you&apos;ll be asked whether to keep this dealer ID or create a new one.</p>
            </div>
          )}
        </section>

        {isEdit ? (
          <section className="card space-y-4">
            <div>
              <h2 className="text-lg font-bold">Dealer codes <Bn>ডিলার কোড</Bn></h2>
              <p className="text-sm text-muted">To add a code for another BU, use &quot;Add new code&quot; on the dealer page.</p>
            </div>
            {codes.map((c, i) => (
              <div key={c._id || i} className="rounded-lg border border-line bg-page/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted">Code {i + 1}</span>
                  {codes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => confirm(`Remove code ${c.dealerCode} from this dealer?`) && setCodes(codes.filter((_, j) => j !== i))}
                      className="cursor-pointer text-sm font-semibold text-danger hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CODE_FIELDS.map((f) => (
                    <TextField key={f.name} field={{ ...f, name: `${f.name}-${i}` }} value={c[f.name]} onChange={setCodesField(i, f.name)} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="card space-y-4">
            <h2 className="text-lg font-bold">Dealer code <Bn>ডিলার কোড</Bn></h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CODE_FIELDS.map((f) => (
                <TextField key={f.name} field={f} value={code[f.name]} onChange={setCodeField(f.name)} />
              ))}
            </div>
          </section>
        )}

        <datalist id="bus">{meta.bus.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="salesGroups">{meta.salesGroups.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="zones">{meta.zones.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="baseNames">{meta.baseNames.map((v) => <option key={v} value={v} />)}</datalist>

        <div className="flex justify-end gap-2">
          <Link to={isEdit ? `/dealers/${id}` : '/dealers'} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add dealer'}
          </button>
        </div>
      </form>

      {/* Ask: keep an existing dealer ID or create a new one? */}
      {asking && (
        <Modal title="Keep dealer ID or create a new one?" onClose={() => !saving && setAsking(false)}>
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Dealer code <span className="font-mono font-bold text-fg">{code.dealerCode.toUpperCase()}</span> (BU {code.bu})
              shares details with an existing dealer. What do you want to do?
            </p>

            {matches.map((m) => (
              <div key={m._id} className="rounded-lg border border-line bg-page/40 p-4">
                <p>
                  <span className="font-mono font-bold text-accent">{m.dealerId}</span>{' '}
                  <span className="font-semibold">{m.ownerName}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Same {matchedText(m)} · NID {m.nidNumber} · TL {m.tradeLicense}
                </p>
                <p className="text-sm text-muted">
                  Codes: <span className="font-mono">{m.codes.map((c) => `${c.dealerCode} (BU ${c.bu})`).join(', ')}</span>
                </p>
                <button
                  type="button"
                  onClick={() => saveNew({ addToDealer: m._id })}
                  disabled={saving}
                  className="btn-primary mt-3 w-full"
                >
                  Keep {m.dealerId}: add this code under it
                </button>
              </div>
            ))}

            {hasExact ? (
              <p className="text-sm text-muted">
                A new dealer ID can&apos;t be created: this exact NID number and trade license already belong to{' '}
                {matches.find((m) => m.exact).dealerId}.
              </p>
            ) : (
              <button type="button" onClick={() => saveNew({ createNew: true })} disabled={saving} className="btn-secondary w-full">
                Create a new dealer ID
              </button>
            )}

            <button type="button" onClick={() => setAsking(false)} disabled={saving} className="btn w-full text-muted hover:text-fg">
              Cancel, go back to the form
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
