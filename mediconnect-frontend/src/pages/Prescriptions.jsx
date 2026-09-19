import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { formatDate, formatDateTime, formatTime } from "../lib/helpers";

export default function Prescriptions() {
  const { user } = useAuth();
  const toast = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRx, setSelectedRx] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getMyPrescriptions();
        setPrescriptions(res.data || []);
      } catch (err) {
        toast.error(err.message || "Could not load prescriptions.");
      } finally {
        setLoading(false);
      }
    })();

  }, []);

  const filteredPrescriptions = useMemo(() => {
    if (!searchQuery.trim()) return prescriptions;
    const q = searchQuery.toLowerCase();
    return prescriptions.filter((p) => {
      const docName = p.doctorId?.userId?.username?.toLowerCase() || "";
      const patName = p.patientId?.userId?.username?.toLowerCase() || "";
      const diagnosis = p.diagnosis?.toLowerCase() || "";
      const spec = p.doctorId?.specialization?.toLowerCase() || "";
      const meds = p.medicines?.map((m) => m.name.toLowerCase()).join(" ") || "";
      return (
        docName.includes(q) ||
        patName.includes(q) ||
        diagnosis.includes(q) ||
        spec.includes(q) ||
        meds.includes(q)
      );
    });
  }, [prescriptions, searchQuery]);

  return (
    <div className="container page" style={{ maxWidth: 1140, paddingBottom: 64 }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <span
            style={{
              background: "#E6F4EA",
              color: "#137333",
              padding: "4px 12px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              display: "inline-block",
              marginBottom: 8,
            }}
          >
            Records
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 34,
              fontWeight: 600,
              margin: "0 0 6px",
              color: "var(--ink)",
            }}
          >
            Prescriptions
          </h1>
          <p style={{ margin: 0, fontSize: 14.5, color: "#4B5563" }}>
            View and manage all your prescribed medications in one place.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", minWidth: 280 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
                fontSize: 14,
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search prescriptions, doctors, or conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 36px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                fontSize: 13,
                background: "#FFFFFF",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Loader label="Fetching prescriptions" />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          title="No prescriptions yet"
          hint="These appear once a completed appointment has one issued by the physician."
        />
      ) : filteredPrescriptions.length === 0 ? (
        <EmptyState
          title="No matching prescriptions"
          hint={`No records match "${searchQuery}". Try a different keyword.`}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredPrescriptions.map((p) => {
            const doctorUser = p.doctorId?.userId || {};
            const patientUser = p.patientId?.userId || {};
            const appt = p.appointmentId || {};
            const counterpartName =
              user?.role === "doctor" ? patientUser.username : `Dr. ${doctorUser.username || "Doctor"}`;
            const initial = (
              user?.role === "doctor" ? patientUser.username : doctorUser.username
            )?.[0]?.toUpperCase() || "D";
            const dateStr = appt.slotDate || p.createdAt;
            const timeStr = appt.slotTime;

            return (
              <div
                key={p._id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  border: "1px solid #E5E7EB",
                  padding: "20px 24px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  flexWrap: "wrap",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                className="prescription-card-row"
              >

                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #DCFCE7",
                    borderRadius: 14,
                    padding: "12px 16px",
                    textAlign: "center",
                    minWidth: 115,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ color: "#059669", fontSize: 16, marginBottom: 2 }}>📅</div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>
                    {formatDate(dateStr)}
                  </div>
                  {timeStr && (
                    <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 500, marginTop: 2 }}>
                      {formatTime(timeStr)}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    minWidth: 200,
                    flex: "1 1 200px",
                  }}
                >
                  {doctorUser.profilePicUrl ? (
                    <img
                      src={doctorUser.profilePicUrl}
                      alt={counterpartName}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1.5px solid #E5E7EB",
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
                        border: "1.5px solid #E5E7EB",
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>
                  )}
                  <div>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        margin: "0 0 2px",
                        color: "#111827",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {counterpartName}
                    </h3>
                    <div style={{ fontSize: 13, color: "#4B5563", fontWeight: 500 }}>
                      {p.doctorId?.specialization || "Medical Specialist"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>
                      {p.doctorId?.qualification || "MBBS, MD"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minWidth: 180,
                    flex: "1 1 180px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5 }}>
                    <span style={{ fontSize: 14, color: "#6B7280" }}>📄</span>
                    <div>
                      <span style={{ color: "#6B7280", fontSize: 11.5, display: "block", fontWeight: 600 }}>
                        Diagnosis
                      </span>
                      <strong style={{ color: "#111827" }}>
                        {p.diagnosis || "General Consultation"}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                    <span style={{ fontSize: 14, color: "#6B7280" }}>💊</span>
                    <div>
                      <span style={{ color: "#6B7280", fontSize: 11.5, display: "block", fontWeight: 600 }}>
                        Medicines Prescribed
                      </span>
                      <span style={{ color: "#374151" }}>
                        {p.medicines?.length || 0} medicine(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {p.followUpDate && (
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #A7F3D0",
                        borderRadius: 10,
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "#065F46",
                        fontWeight: 600,
                      }}
                    >
                      <span>📅</span> Follow-up {formatDate(p.followUpDate)}
                    </div>
                  )}

                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "#F0FDF4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    💊
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRx(p)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#0F3E36",
                    fontWeight: 600,
                    fontSize: 13.5,
                    padding: "8px 12px",
                    borderRadius: 10,
                    transition: "all 0.15s ease",
                  }}
                  className="view-rx-btn"
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#F0FDF4",
                      color: "#0F3E36",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    ›
                  </div>
                  <span>View prescription</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedRx && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(17, 24, 39, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setSelectedRx(null)}
        >
          <div
            style={{
              maxWidth: 640,
              width: "100%",
              maxHeight: "90vh",
              background: "#FFFFFF",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div
              style={{
                background: "linear-gradient(135deg, #0F3E36 0%, #185A4F 100%)",
                padding: "22px 28px",
                color: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  🩺
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 19,
                      margin: 0,
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      color: "#FFFFFF",
                    }}
                  >
                    MediConnect
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#A7F3D0" }}>
                    Official Digital Medical Prescription
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    color: "#FFFFFF",
                    padding: "4px 10px",
                    borderRadius: 9999,
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Verified Rx
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRx(null)}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#FFFFFF",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    lineHeight: 1,
                    transition: "background 0.15s",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingBottom: 16,
                  borderBottom: "1px solid #E5E7EB",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    PRESCRIPTION NO.
                  </span>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111827",
                      marginTop: 2,
                    }}
                  >
                    RX-{selectedRx._id.slice(-8).toUpperCase()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    ISSUE DATE
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 2 }}>
                    {formatDateTime(selectedRx.createdAt)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "#F9FAFB",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #F3F4F6",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    PATIENT
                  </span>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginTop: 4 }}>
                    {selectedRx.patientId?.userId?.username || user?.username || "Patient"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    {selectedRx.patientId?.userId?.email || user?.email || ""}
                  </div>
                  {selectedRx.patientId?.userId?.phone && (
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
                      📞 {selectedRx.patientId?.userId?.phone}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: "#F9FAFB",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #F3F4F6",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    DOCTOR / PROVIDER
                  </span>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginTop: 4 }}>
                    Dr. {selectedRx.doctorId?.userId?.username || "Doctor"}
                  </div>
                  <div style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginTop: 2 }}>
                    {selectedRx.doctorId?.specialization || "Telehealth Specialist"}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 1 }}>
                    {selectedRx.doctorId?.qualification || "MBBS, MD"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#F9FAFB",
                  padding: "12px 16px",
                  borderRadius: 10,
                  marginBottom: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #F3F4F6",
                }}
              >
                <span style={{ fontSize: 13, color: "#4B5563", fontWeight: 500 }}>
                  Consultation Schedule:
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {formatDate(selectedRx.appointmentId?.slotDate || selectedRx.createdAt)}
                  {selectedRx.appointmentId?.slotTime
                    ? ` at ${formatTime(selectedRx.appointmentId.slotTime)}`
                    : ""}
                </span>
              </div>

              <div
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 12,
                  padding: "16px 18px",
                  marginBottom: 22,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#15803D",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Clinical Diagnosis
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F3E36", marginLeft: 24 }}>
                  {selectedRx.diagnosis || "General Consultation"}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>💊</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111827",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Prescribed Medicines ({selectedRx.medicines?.length || 0})
                    </span>
                  </div>
                </div>

                {!selectedRx.medicines || selectedRx.medicines.length === 0 ? (
                  <p style={{ color: "#6B7280", fontSize: 13, fontStyle: "italic", margin: 0 }}>
                    No medications listed.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedRx.medicines.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#FAFAFA",
                          border: "1px solid #E5E7EB",
                          borderRadius: 10,
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827" }}>
                            {m.name}
                          </div>
                          {m.instructions && (
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                              📝 {m.instructions}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          {m.dosage && (
                            <span
                              style={{
                                background: "#E0F2FE",
                                color: "#0369A1",
                                fontSize: 12,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              {m.dosage}
                            </span>
                          )}
                          {m.frequency && (
                            <span
                              style={{
                                background: "#FEF3C7",
                                color: "#92400E",
                                fontSize: 12,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              {m.frequency}
                            </span>
                          )}
                          {m.duration && (
                            <span
                              style={{
                                background: "#F3F4F6",
                                color: "#374151",
                                fontSize: 12,
                                fontWeight: 600,
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              ⏱ {m.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRx.followUpDate && (
                <div
                  style={{
                    background: "#FEF9C3",
                    border: "1px solid #FDE047",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#854D0E",
                    fontWeight: 600,
                  }}
                >
                  <span>📅</span>
                  <span>Recommended Follow-up: {formatDate(selectedRx.followUpDate)}</span>
                </div>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid #E5E7EB",
                padding: "16px 28px",
                background: "#F9FAFB",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedRx(null)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  background: "#FFFFFF",
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #0F3E36 0%, #185A4F 100%)",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🖨️</span> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .prescription-card-row:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.06) !important;
          border-color: #D1D5DB !important;
        }
        .view-rx-btn:hover {
          background: #F4F8F6;
        }
        @media (max-width: 768px) {
          .prescription-card-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
