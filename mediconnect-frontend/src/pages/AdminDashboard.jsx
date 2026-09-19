import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { formatINR } from "../lib/helpers";
import Loader from "../components/Loader";

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("pending");
  const [actionBusyId, setActionBusyId] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctors();
      setDoctors(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load doctors list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();

  }, []);

  const handleToggleVerification = async (doctor, targetStatus) => {
    setActionBusyId(doctor._id);
    try {
      const res = await api.verifyDoctor(doctor._id, targetStatus);
      const updatedDoctor = res.data;

      setDoctors((prev) =>
        prev.map((d) => (d._id === doctor._id ? { ...d, isVerified: updatedDoctor.isVerified } : d))
      );

      const doctorName = doctor.userId?.username || "Doctor";
      if (targetStatus) {
        toast.success(`Dr. ${doctorName} is now verified! Patients can book appointments.`);
      } else {
        toast.info(`Dr. ${doctorName}'s verification revoked. Booking access suspended.`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update doctor verification status.");
    } finally {
      setActionBusyId(null);
    }
  };

  const totalDoctors = doctors.length;
  const pendingDoctors = doctors.filter((d) => !d.isVerified);
  const verifiedDoctors = doctors.filter((d) => d.isVerified);
  const uniqueSpecialties = new Set(doctors.map((d) => d.specialization).filter(Boolean)).size;

  const displayedDoctors = doctors.filter((doc) => {
    const matchesTab =
      filterTab === "all"
        ? true
        : filterTab === "pending"
        ? !doc.isVerified
        : doc.isVerified;

    if (!matchesTab) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const docUser = doc.userId || {};
    const name = (docUser.username || "").toLowerCase();
    const email = (docUser.email || "").toLowerCase();
    const spec = (doc.specialization || "").toLowerCase();
    const qual = (doc.qualification || "").toLowerCase();

    return name.includes(term) || email.includes(term) || spec.includes(term) || qual.includes(term);
  });

  return (
    <div className="container page" style={{ maxWidth: 1200 }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: "#0F3E36", fontWeight: 700 }}>
              Administrative Console · 3-Portal RBAC
            </span>
            <span
              className="badge badge-teal"
              style={{ fontSize: 11, padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Role: Admin
            </span>
          </div>
          <h1 style={{ fontSize: 32, margin: 0, fontWeight: 700, color: "#111827" }}>
            Provider Compliance &amp; Verification Hub
          </h1>
          <p style={{ margin: "8px 0 0", color: "#6B7280", fontSize: 15, maxWidth: 650 }}>
            Inspect medical credentials, enforce telemedicine licensing compliance, and grant booking privileges to
            registered practitioners across MediConnect.
          </p>
        </div>

        <div
          className="card card-pad"
          style={{
            padding: "12px 18px",
            background: "#F0FDF4",
            borderColor: "#BBF7D0",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#0F3E36",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#166534", fontWeight: 700 }}>
              Primary Admin Session
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>
              {user?.email || "Admin"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="card card-pad" style={{ borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Registered
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "6px 0" }}>
            {totalDoctors}
          </div>
          <div style={{ fontSize: 12, color: "#4B5563" }}>Medical practitioners in system</div>
        </div>

        <div
          className="card card-pad"
          style={{
            borderRadius: 14,
            borderColor: pendingDoctors.length > 0 ? "#FDE68A" : "var(--line)",
            background: pendingDoctors.length > 0 ? "#FFFBEB" : "var(--paper-card)",
          }}
        >
          <div style={{ fontSize: 12, color: "#92400E", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ⏳ Pending Verification
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#B45309", margin: "6px 0" }}>
            {pendingDoctors.length}
          </div>
          <div style={{ fontSize: 12, color: "#78350F" }}>
            {pendingDoctors.length > 0 ? "Requires administrative review" : "Queue fully cleared"}
          </div>
        </div>

        <div className="card card-pad" style={{ borderRadius: 14, background: "#F0FDF4", borderColor: "#DCFCE7" }}>
          <div style={{ fontSize: 12, color: "#15803D", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ✅ Verified &amp; Active
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#166534", margin: "6px 0" }}>
            {verifiedDoctors.length}
          </div>
          <div style={{ fontSize: 12, color: "#15803D" }}>Available for patient bookings</div>
        </div>

        <div className="card card-pad" style={{ borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Specialties Covered
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0F3E36", margin: "6px 0" }}>
            {uniqueSpecialties}
          </div>
          <div style={{ fontSize: 12, color: "#4B5563" }}>Distinct clinical departments</div>
        </div>
      </div>

      <div
        className="card card-pad"
        style={{
          borderRadius: 14,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setFilterTab("pending")}
            className="btn"
            style={{
              background: filterTab === "pending" ? "#0F3E36" : "#F3F4F6",
              color: filterTab === "pending" ? "#FFFFFF" : "#374151",
              fontWeight: 600,
              fontSize: 13.5,
              borderRadius: 8,
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⏳ Pending Action
            {pendingDoctors.length > 0 && (
              <span
                style={{
                  background: filterTab === "pending" ? "#F59E0B" : "#E5E7EB",
                  color: filterTab === "pending" ? "#78350F" : "#111827",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "1px 7px",
                  borderRadius: 9999,
                }}
              >
                {pendingDoctors.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("verified")}
            className="btn"
            style={{
              background: filterTab === "verified" ? "#0F3E36" : "#F3F4F6",
              color: filterTab === "verified" ? "#FFFFFF" : "#374151",
              fontWeight: 600,
              fontSize: 13.5,
              borderRadius: 8,
              padding: "8px 14px",
            }}
          >
            ✅ Verified Practitioners ({verifiedDoctors.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className="btn"
            style={{
              background: filterTab === "all" ? "#0F3E36" : "#F3F4F6",
              color: filterTab === "all" ? "#FFFFFF" : "#374151",
              fontWeight: 600,
              fontSize: 13.5,
              borderRadius: 8,
              padding: "8px 14px",
            }}
          >
            All Providers ({totalDoctors})
          </button>
        </div>

        <div style={{ minWidth: 260, flex: "1 1 260px", maxWidth: 400 }}>
          <input
            type="search"
            placeholder="Search by doctor name, email, specialty…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px",
              fontSize: 13.5,
              borderRadius: 8,
              border: "1px solid var(--line)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {loading ? (
        <Loader label="Synchronizing provider compliance records…" />
      ) : displayedDoctors.length === 0 ? (
        <div
          className="card card-pad"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            borderRadius: 14,
            background: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: 42, marginBottom: 12 }}>
            {filterTab === "pending" ? "🎉" : "🔍"}
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111827" }}>
            {filterTab === "pending"
              ? "All Doctor Verifications Up to Date"
              : "No Doctors Match Your Filter"}
          </h3>
          <p style={{ color: "#6B7280", margin: "0 auto", maxWidth: 460, fontSize: 14 }}>
            {filterTab === "pending"
              ? "There are currently no doctor profiles pending license verification. Any new doctors who register will immediately appear here for your review."
              : "Try adjusting your search criteria or switch tabs to find the provider."}
          </p>
          {filterTab !== "all" && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilterTab("all");
                setSearchTerm("");
              }}
              style={{ marginTop: 18 }}
            >
              View All Doctors
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {displayedDoctors.map((doctor) => {
            const docUser = doctor.userId || {};
            const isBusy = actionBusyId === doctor._id;

            return (
              <div
                key={doctor._id}
                className="card card-pad card-elevated"
                style={{
                  borderRadius: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                  padding: "20px 24px",
                  borderLeft: doctor.isVerified ? "4px solid #059669" : "4px solid #D97706",
                }}
              >

                <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 280, flex: "1 1 300px" }}>
                  {docUser.profilePicUrl ? (
                    <img
                      src={docUser.profilePicUrl}
                      alt={docUser.username || "Doctor"}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid var(--line)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#EAF2EF",
                        color: "#0F3E36",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {(docUser.username || "Dr")[0].toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16.5, color: "#111827" }}>
                        Dr. {docUser.username || "Doctor"}
                      </span>
                      {doctor.isVerified ? (
                        <span className="badge badge-teal" style={{ fontSize: 11 }}>
                          ✅ Verified Practitioner
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: "#FEF3C7",
                            color: "#92400E",
                            borderColor: "#FDE68A",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ⏳ Pending License Verification
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 13.5, color: "#4B5563", marginBottom: 4 }}>
                      <strong style={{ color: "#0F3E36" }}>{doctor.specialization}</strong> · {doctor.qualification} ·{" "}
                      {doctor.experience} yrs exp
                    </div>

                    <div style={{ fontSize: 12.5, color: "#6B7280", display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span>✉️ {docUser.email || "No email"}</span>
                      {docUser.phone && <span>📞 {docUser.phone}</span>}
                      <span>💰 Fee: {formatINR(doctor.consultationFee)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <Link
                    to={`/doctors/${doctor._id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: 13, padding: "8px 14px", textDecoration: "none" }}
                  >
                    View Profile
                  </Link>

                  {doctor.isVerified ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleVerification(doctor, false)}
                      className="btn"
                      style={{
                        background: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        fontWeight: 600,
                        fontSize: 13,
                        padding: "8px 14px",
                        borderRadius: 8,
                      }}
                    >
                      {isBusy ? "Updating…" : "Revoke Verification"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleVerification(doctor, true)}
                      className="btn"
                      style={{
                        background: "#059669",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "8px 18px",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                      }}
                    >
                      {isBusy ? "Verifying…" : "✓ Approve & Verify Doctor"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
