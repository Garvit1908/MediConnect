export default function EmptyState({ title, hint, action }) {
  return (
    <div className="empty-state">
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 6, color: "var(--ink)" }}>
        {title}
      </div>
      {hint && <div className="faint" style={{ marginBottom: action ? 16 : 0 }}>{hint}</div>}
      {action}
    </div>
  );
}
