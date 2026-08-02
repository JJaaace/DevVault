export function EmptyState({ title, message, action }) {
  return (
    <div className="surface-card surface-card--strong p-6 text-center">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-soft)]">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
