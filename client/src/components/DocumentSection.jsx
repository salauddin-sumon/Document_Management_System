import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from './Spinner.jsx'
import Modal from './Modal.jsx'
import { EmptyState } from './ui.jsx'
import { formatDate, formatDay, formatSize, displayName } from '../utils/format.js'

const EMPTY = { title: '', docType: 'contract', expiryDate: '', file: null }

const isExpired = (d) => d.expiryDate && new Date(d.expiryDate) < new Date()

// Any extra files for a dealer.
// Everyone can view and download; only admins can upload or delete.
export default function DocumentSection({ dealerId }) {
  const { isAdmin } = useAuth()
  const [docs, setDocs] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    api
      .get(`/dealers/${dealerId}/documents`)
      .then((res) => setDocs(res.data))
      .catch((err) => toast.error(errorMessage(err)))
  }, [dealerId])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!form.file) return toast.error('Please choose a file')

    // Files must be sent as multipart/form-data, not JSON
    const data = new FormData()
    data.append('file', form.file)
    data.append('title', form.title || form.file.name)
    data.append('docType', form.docType)
    if (form.expiryDate) data.append('expiryDate', form.expiryDate)

    setProgress(0)
    try {
      const res = await api.post(`/dealers/${dealerId}/documents`, data, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / (p.total || 1))),
      })
      setDocs([res.data, ...docs])
      setOpen(false)
      setForm(EMPTY)
      toast.success('File uploaded')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setProgress(null)
    }
  }

  const handleDelete = async (d) => {
    if (!confirm(`Delete "${d.title}"? The file will be removed permanently.`)) return
    try {
      await api.delete(`/documents/${d._id}`)
      setDocs(docs.filter((x) => x._id !== d._id))
      toast.success('File deleted')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (!docs) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Contracts, invoices and any other files.</p>
        {isAdmin && <button onClick={() => setOpen(true)} className="btn-primary">Upload</button>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        {docs.length === 0 ? (
          <EmptyState title="No other files yet" />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="th">Title</th>
                <th className="th">Type</th>
                <th className="th">Size</th>
                <th className="th">Expires</th>
                <th className="th">Uploaded</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {docs.map((d) => (
                <tr key={d._id}>
                  <td className="td">
                    <div className="font-semibold text-fg">{d.title}</div>
                    <div className="text-xs text-muted">{d.originalName}</div>
                  </td>
                  <td className="td text-muted capitalize">{d.docType}</td>
                  <td className="td text-muted">{formatSize(d.size)}</td>
                  <td className={`td ${isExpired(d) ? 'font-semibold text-danger' : 'text-muted'}`}>
                    {formatDay(d.expiryDate)}
                    {isExpired(d) && ' (expired)'}
                  </td>
                  <td className="td text-muted">
                    {formatDate(d.createdAt)}
                    <div className="text-xs">{displayName(d.uploadedBy)}</div>
                  </td>
                  <td className="td text-right whitespace-nowrap">
                    {/* The auth cookie is sent automatically, so a plain link works */}
                    <a href={`/api/documents/${d._id}/download`} className="link mr-3">Download</a>
                    {isAdmin && (
                      <button onClick={() => handleDelete(d)} className="cursor-pointer font-semibold text-danger hover:underline">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title="Upload file" onClose={() => progress === null && setOpen(false)}>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="label">File * (max 10 MB)</label>
              <input
                type="file"
                className="input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })}
                required
              />
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="Defaults to the file name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
                  <option value="contract">Contract</option>
                  <option value="invoice">Invoice</option>
                  <option value="license">License</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Expiry date</label>
                <input type="date" className="input" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
            </div>
            {progress !== null && (
              <div className="h-2 overflow-hidden rounded bg-surface-2">
                <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary" disabled={progress !== null}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={progress !== null}>
                {progress !== null ? `Uploading ${progress}%` : 'Upload'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
