import { STATUS_BADGE } from "../lib/helpers";

export default function StatusBadge({ status }) {
  const cls = STATUS_BADGE[status] || "badge-neutral";
  return <span className={`badge ${cls}`}>{status}</span>;
}
