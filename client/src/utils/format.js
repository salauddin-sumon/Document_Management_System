// For timestamps (createdAt etc.), shown in the viewer's local time
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

// For calendar dates picked in a form (issue date, code open date, expiry).
// They are stored as midnight UTC, so display them in UTC to avoid off-by-one days.
export const formatDay = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
    : '—'

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

// Value for <input type="date">
export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')
export const today = () => new Date().toISOString().slice(0, 10)

export const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ROLE_LABELS = { admin: 'Admin', zm_hos: 'ZM/HOS', staff: 'Staff' }

// Best short name for a user: name, else staff ID, else email
export const displayName = (u) => u?.name || u?.staffId || u?.email || 'Unknown'
