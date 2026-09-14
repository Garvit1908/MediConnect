import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatDate, formatINR, formatTime } from "../lib/helpers";
import { useAuth } from "../lib/auth";

export default function AppointmentCard({ appointment }) {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const doctor = appointment.doctorId || {};
  const patient = appointment.patientId || {};
  const doctorUser = doctor.userId || {};
  const patientUser = patient.userId || {};

  const isDoctorRole = user?.role === "doctor";
  const targetUser = isDoctorRole ? patientUser : doctorUser;
  const counterpartLabel = isDoctorRole
    ? `Patient: ${patientUser.username || "—"}`
    : `Dr. ${doctorUser.username || "—"}`;

  const initial = targetUser.username ? targetUser.username[0].toUpperCase() : (isDoctorRole ? "P" : "D");

  return (
    <Link
      to={`/appointments/${appointment._id}`}
      className="card card-pad"
      style={{ display: "block", textDecoration: "none" }}
    >
      <div className="spread" style={{ marginBottom: 12 }}>
        <span className="eyebrow">{formatDate(appointment.slotDate)} · {formatTime(appointment.slotTime)}</span>
        <StatusBadge status={appointment.status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        {targetUser.profilePicUrl && !imgError ? (
          <img
            src={targetUser.profilePicUrl}
            alt={counterpartLabel}
            onError={() => setImgError(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1.5px solid var(--line)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--pine-tint)",
              color: "var(--pine)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 19,
              fontFamily: "var(--font-display)",
              border: "1.5px solid var(--line)",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: 18, margin: "0 0 2px", lineHeight: 1.25 }}>{counterpartLabel}</h3>
          {doctor.specialization && !isDoctorRole && (
            <p className="faint" style={{ margin: 0, fontSize: 13 }}>{doctor.specialization}</p>
          )}
        </div>
      </div>

      <div className="ledger-row">
        <span className="ledger-label">Consultation Fee</span>
        <span className="ledger-value">{formatINR(appointment.consultationFee)}</span>
      </div>
    </Link>
  );
}
