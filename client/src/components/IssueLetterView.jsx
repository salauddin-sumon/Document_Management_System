import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'
import Spinner from './Spinner.jsx'
import { formatDay, formatDateTime, formatSize, displayName } from '../utils/format.js'

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-fg">{children || '—'}</dd>
    </div>
  )
}

// Read-only view of one issue letter. Admins also get Edit and Delete.
export default function IssueLetterView({ letterId, onClose, onEdit, onDeleted }) {
  const { isAdmin } = useAuth()
  const [letter, setLetter] = useState(null)

  useEffect(() => {
    api
      .get(`/issue-letters/${letterId}`)
      .then((res) => setLetter(res.data))
      .catch((err) => {
        toast.error(errorMessage(err))
        onClose()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterId])

  const handleDelete = async () => {
    if (!confirm(`Delete letter ${letter.referenceNumber}? This cannot be undone.`)) return
    try {
      await api.delete(`/issue-letters/${letter._id}`)
      toast.success('Letter deleted')
      onDeleted()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Modal title={letter ? `Letter ${letter.referenceNumber}` : 'Letter'} onClose={onClose} wide>
      {!letter ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Issue date">{formatDay(letter.issueDate)}</Field>
            <Field label="Reference no"><span className="font-mono">{letter.referenceNumber}</span></Field>
            <Field label="Dealer code">
              <span className="font-mono">{letter.dealerCode}</span>
              {letter.salesGroup && <span className="text-muted"> · {letter.salesGroup}</span>}
            </Field>
            <Field label="BU">{letter.bu}</Field>
            <Field label="Issued to">
              {letter.dealer ? (
                <Link to={`/dealers/${letter.dealer._id}`} onClick={onClose} className="link">
                  {letter.ownerName} · <span className="font-mono">{letter.dealerId}</span>
                </Link>
              ) : (
                `${letter.ownerName || ''} · ${letter.dealerId || ''} (dealer deleted)`
              )}
            </Field>
            <Field label="Issuer">{letter.issuerName}</Field>
            <Field label="Issuer staff ID">{letter.issuerStaffId}</Field>
            <Field label="Designation">{letter.designation}</Field>
            <Field label="Recorded by">
              {displayName(letter.createdBy)} · {formatDateTime(letter.createdAt)}
            </Field>
          </dl>

          <div>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">Note</p>
            <p className="mt-1 rounded-lg bg-surface-2 p-3 whitespace-pre-wrap text-fg">{letter.note}</p>
          </div>

          <div>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">Attachment</p>
            {letter.attachment ? (
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-fg">📎 {letter.attachment.originalName}</span>
                <span className="text-muted">({formatSize(letter.attachment.size)})</span>
                {/* The auth cookie is sent automatically, so plain links work */}
                <a href={`/api/issue-letters/${letter._id}/attachment?inline=1`} target="_blank" rel="noreferrer" className="link">View</a>
                <a href={`/api/issue-letters/${letter._id}/attachment`} className="link">Download</a>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">No attachment</p>
            )}
          </div>

          {isAdmin && (
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button onClick={handleDelete} className="btn-danger">Delete</button>
              <button onClick={() => onEdit(letter)} className="btn-primary">Edit</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
