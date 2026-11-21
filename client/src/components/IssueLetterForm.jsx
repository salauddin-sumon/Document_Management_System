import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'
import DealerCodeInput from './DealerCodeInput.jsx'
import { Bn } from './ui.jsx'
import { today, toDateInput, formatSize } from '../utils/format.js'

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg'

// Create (letter = null) or edit (letter = existing) an issue letter.
// Fields: issue date, reference no, dealer code, BU, issuer name, issuer staff ID, designation, note, attachment.
// presetDealer limits the code suggestions when opened from a dealer's page.
export default function IssueLetterForm({ letter, presetDealer, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = Boolean(letter)
  const [codes, setCodes] = useState([])
  const [file, setFile] = useState(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)
  const [progress, setProgress] = useState(null)
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          issueDate: toDateInput(letter.issueDate),
          referenceNumber: letter.referenceNumber,
          dealerCode: letter.dealerCode,
          issuerName: letter.issuerName,
          issuerStaffId: letter.issuerStaffId,
          designation: letter.designation,
          note: letter.note,
        }
      : {
          issueDate: today(),
          referenceNumber: '',
          // A dealer with a single code gets it filled in automatically
          dealerCode: presetDealer?.codes.length === 1 ? presetDealer.codes[0].dealerCode : '',
          // Pre-fill the issuer from the logged-in user; still editable
          issuerName: user.name || '',
          issuerStaffId: user.staffId || '',
          designation: user.designation || '',
          note: '',
        }
  )

  useEffect(() => {
    api
      .get('/dealers/codes')
      .then((res) => setCodes(presetDealer ? res.data.filter((c) => c.dealer === presetDealer._id) : res.data))
      .catch(() => {})
  }, [presetDealer])

  // The BU always comes from the dealer code
  const match = codes.find((c) => c.dealerCode === form.dealerCode.trim().toUpperCase())

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Files must be sent as multipart/form-data, not JSON
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    if (file) data.append('attachment', file)
    if (isEdit && removeAttachment && !file) data.append('removeAttachment', 'true')

    setProgress(0)
    try {
      const opts = { onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / (p.total || 1))) }
      if (isEdit) await api.put(`/issue-letters/${letter._id}`, data, opts)
      else await api.post('/issue-letters', data, opts)
      toast.success(isEdit ? 'Letter updated' : 'Letter issued')
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setProgress(null)
    }
  }

  const busy = progress !== null

  return (
    <Modal title={isEdit ? 'Edit letter' : 'Issue letter'} onClose={() => !busy && onClose()} wide>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Issue date * <Bn>তারিখ</Bn></label>
          <input type="date" className="input" value={form.issueDate} onChange={set('issueDate')} required />
        </div>
        <div>
          <label className="label">Reference no * <Bn>সূত্র নম্বর</Bn></label>
          <input
            className="input font-mono"
            value={form.referenceNumber}
            onChange={set('referenceNumber')}
            placeholder="e.g. SRC-2026-001"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Dealer code * <Bn>ডিলার কোড</Bn></label>
          <DealerCodeInput
            codes={codes}
            value={form.dealerCode}
            onChange={(dealerCode) => setForm({ ...form, dealerCode })}
            required
          />
          {form.dealerCode && (
            <p className={`mt-1 text-xs ${match ? 'text-ok' : 'text-warn'}`}>
              {match ? `${match.dealerId} · ${match.ownerName} · ${match.salesGroup}` : 'No dealer with this code'}
            </p>
          )}
        </div>
        <div>
          <label className="label">BU <Bn>বিজনেস ইউনিট</Bn></label>
          <input className="input" value={match?.bu || ''} placeholder="Filled from the dealer code" readOnly tabIndex={-1} />
        </div>
        <div>
          <label className="label">Issuer name * <Bn>ইস্যুকারী</Bn></label>
          <input className="input" value={form.issuerName} onChange={set('issuerName')} required />
        </div>
        <div>
          <label className="label">Issuer staff ID * <Bn>স্টাফ আইডি</Bn></label>
          <input className="input" value={form.issuerStaffId} onChange={set('issuerStaffId')} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Designation * <Bn>পদবি</Bn></label>
          <input className="input" value={form.designation} onChange={set('designation')} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Note * <Bn>নোট</Bn></label>
          <textarea className="input" rows={5} value={form.note} onChange={set('note')} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Attachment <span className="font-normal text-muted">(optional, max 10 MB)</span></label>
          {isEdit && letter.attachment && !file && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className={removeAttachment ? 'text-faint line-through' : 'text-fg'}>
                📎 {letter.attachment.originalName} ({formatSize(letter.attachment.size)})
              </span>
              <label className="flex items-center gap-1 text-xs text-danger">
                <input type="checkbox" checked={removeAttachment} onChange={(e) => setRemoveAttachment(e.target.checked)} />
                Remove
              </label>
            </div>
          )}
          <input type="file" className="input" accept={ACCEPT} onChange={(e) => setFile(e.target.files[0] || null)} />
          {isEdit && letter.attachment && (
            <p className="mt-1 text-xs text-muted">Choosing a new file replaces the current one.</p>
          )}
        </div>

        {busy && (
          <div className="h-2 overflow-hidden rounded bg-surface-2 sm:col-span-2">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? `Saving ${progress}%` : isEdit ? 'Save changes' : 'Issue letter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
