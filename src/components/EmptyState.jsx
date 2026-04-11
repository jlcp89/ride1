import { EmptyBoxIcon } from './icons'

export default function EmptyState({
  title = 'No rides match the current filters.',
  hint = 'Try loosening a filter or clearing them all to see every ride.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon">
        <EmptyBoxIcon size={56} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__hint">{hint}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="empty-state__action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
