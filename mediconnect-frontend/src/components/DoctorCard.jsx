import { useState } from "react";
import { Link } from "react-router-dom";
import { formatINR } from "../lib/helpers";

export default function DoctorCard({ doctor }) {
  const user = doctor.userId || {};
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/doctors/${doctor._id}`} className="card card-pad" style={{ display: "block", textDecoration: "none" }}>
      <div className="spread" style={{ marginBottom: 12 }}>
        <span className="eyebrow">{doctor.specialization}</span>
        {doctor.isVerified ? (
          <span className="badge badge-teal">Verified</span>
        ) : (
          <span className="badge badge-neutral">Unverified</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        {user.profilePicUrl && !imgError ? (
          <img
            src={user.profilePicUrl}
            alt={`Dr. ${user.username || "Doctor"}`}
            onError={() => setImgError(true)}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1.5px solid var(--line)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--pine-tint)",
              color: "var(--pine)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 20,
              fontFamily: "var(--font-display)",
              border: "1.5px solid var(--line)",
              flexShrink: 0,
            }}
          >
            {user.username ? user.username[0].toUpperCase() : "D"}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 20, marginBottom: 2, lineHeight: 1.2 }}>Dr. {user.username || "Unknown"}</h3>
          <p className="faint" style={{ margin: 0, fontSize: 13 }}>{doctor.qualification}</p>
        </div>
      </div>

      <div className="ledger-row">
        <span className="ledger-label">Experience</span>
        <span className="ledger-value">{doctor.experience} yrs</span>
      </div>
      <div className="ledger-row">
        <span className="ledger-label">Consultation Fee</span>
        <span className="ledger-value">{formatINR(doctor.consultationFee)}</span>
      </div>
      <div className="ledger-row" style={{ borderBottom: "none", paddingBottom: 6 }}>
        <span className="ledger-label">Available Days</span>
        <span className="ledger-value">
          {doctor.availability && doctor.availability.length > 0
            ? doctor.availability.map((a) => a.day).join(", ")
            : "Not set"}
        </span>
      </div>
      <div style={{ marginTop: 14 }}>
        <span className="btn btn-outline btn-sm btn-block" style={{ color: "var(--pine)", borderColor: "#D1D5DB" }}>
          View Profile &amp; Slots →
        </span>
      </div>
    </Link>
  );
}

