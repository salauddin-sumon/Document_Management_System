export default function Spinner({ full = false }) {
  const spinner = (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-accent" />
  )
  if (full) return <div className="flex h-screen items-center justify-center">{spinner}</div>
  return <div className="flex justify-center py-10">{spinner}</div>
}
