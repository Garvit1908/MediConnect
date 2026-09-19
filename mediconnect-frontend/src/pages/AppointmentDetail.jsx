import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import {
  formatDate,
  formatINR,
  formatTime,
  generateSlots,
  getConsultationAccess,
  isMarkedPaid,
  loadRazorpayScript,
  markPaid,
  todayISODate,
  weekdayFor,
} from "../lib/helpers";

export default function AppointmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [imgError, setImgError] = useState(false);

  const load = async () => {
    try {
      const res = await api.getAppointmentById(id);
      setAppointment(res.data);
      setPaid(isMarkedPaid(id) || res.data?.status === "confirmed" || res.data?.status === "completed");
    } catch (err) {
      toast.error(err.message || "Could not load appointment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

  }, [id]);

  if (loading) return <div className="container page"><Loader label="Loading appointment details" /></div>;
  if (!appointment) return <div className="container page"><div className="alert alert-error">Appointment not found.</div></div>;

  const doctor = appointment.doctorId || {};
  const patient = appointment.patientId || {};
  const doctorUser = doctor.userId || {};
  const patientUser = patient.userId || {};
  const isPatient = user?.role === "patient";
  const isDoctor = user?.role === "doctor";
  const isActive = appointment.status !== "cancelled" && appointment.status !== "completed";
  const isConfirmed = appointment.status === "confirmed";
  const slotDateStr = appointment.slotDate?.slice?.(0, 10) || "";
  const consultAccess = getConsultationAccess(appointment.slotDate, appointment.slotTime, appointment.status, user?.role);
  const doctorDocId = doctor._id || appointment.doctorId?._id || appointment.doctorId;

  const subtitleText =
    appointment.status === "completed"
      ? "Your consultation has been completed successfully."
      : appointment.status === "confirmed"
      ? "Your appointment is confirmed. Join the video consultation room when scheduled."
      : appointment.status === "pending"
      ? "Payment is required to confirm your appointment and unlock the consultation room."
      : "This appointment has been cancelled.";

  const copyConsultationId = () => {
    const code = appointment._id.slice(-8).toUpperCase();
    navigator.clipboard.writeText(code);
    toast.success(`Consultation ID #${code} copied to clipboard!`);
  };

  return (
    <div className="container page" style={{ maxWidth: 940, paddingBottom: 64 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Link
          to="/appointments"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#4B5563",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
            transition: "color 0.15s ease",
          }}
        >
          ← Back to Appointments
        </Link>
        <StatusBadge status={appointment.status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: 16,
            background: "#E6F4EA",
            color: "#0F3E36",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", fontWeight: 700 }}>
            Appointment
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, margin: "2px 0 4px", color: "var(--ink)" }}>
            {formatDate(appointment.slotDate)} · {formatTime(appointment.slotTime)}
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "#4B5563" }}>
            {subtitleText}
          </p>
        </div>
      </div>

      {isConfirmed && (
        <div
          style={{
            background: consultAccess.allowed ? "#F0FDF4" : "#FFFFFF",
            border: consultAccess.allowed ? "1.5px solid #10B981" : "1px solid #E5E7EB",
            borderRadius: 18,
            padding: "22px 24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: consultAccess.allowed ? "#047857" : "#6B7280" }}>
              Telehealth Video Consultation
            </span>
            {consultAccess.allowed && (
              <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: 9999, fontSize: 11.5, fontWeight: 600 }}>
                ● Active Now
              </span>
            )}
          </div>
          <h3 style={{ margin: "4px 0 8px", fontSize: 19, color: "#111827" }}>Live 1-on-1 Consultation Room</h3>
          <p style={{ fontSize: 13.5, color: consultAccess.allowed ? "#065F46" : "#4B5563", marginBottom: 16, lineHeight: 1.5 }}>
            {consultAccess.allowed
              ? "Your consultation session window is currently open. Click below to enter the secure room."
              : consultAccess.reason}
          </p>
          {consultAccess.allowed ? (
            <Link
              to={`/appointments/${appointment._id}/consultation`}
              className="btn btn-teal"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 8, fontWeight: 600 }}
            >
              🎥 Join Video Consultation
            </Link>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
                🔒 Consultation Locked
              </button>
              <span style={{ fontSize: 12.5, color: "#6B7280" }}>
                Opens 30m before scheduled slot
              </span>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          border: "1px solid #E5E7EB",
          padding: "26px 28px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          marginBottom: 20,
        }}
      >

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#111827" }}>Appointment Details</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#6B7280" }}>
            <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
              CONSULTATION ID #{appointment._id.slice(-8).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={copyConsultationId}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px", color: "#6B7280" }}
              title="Copy Consultation ID"
            >
              📋
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32, alignItems: "center" }} className="appointment-details-grid">

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {doctorUser.profilePicUrl && !imgError ? (
              <img
                src={doctorUser.profilePicUrl}
                alt={`Dr. ${doctorUser.username || "Doctor"}`}
                onError={() => setImgError(true)}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #E5E7EB",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--pine-tint)",
                  color: "var(--pine)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 24,
                  fontFamily: "var(--font-display)",
                  border: "2px solid #E5E7EB",
                  flexShrink: 0,
                }}
              >
                {doctorUser.username ? doctorUser.username[0].toUpperCase() : "D"}
              </div>
            )}
            <div>
              <h3 style={{ fontSize: 18.5, fontWeight: 700, margin: "0 0 2px", color: "#111827" }}>
                Dr. {doctorUser.username || "Doctor"}
              </h3>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#4B5563", marginBottom: 2 }}>
                {doctor.specialization}
              </div>
              <div style={{ fontSize: 13, color: "#6B7280" }}>
                {doctor.qualification || "MBBS, MD"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>👤</span> Patient
              </span>
              <span style={{ fontWeight: 600, color: "#111827" }}>{patientUser.username || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>💳</span> Consultation Fee
              </span>
              <span style={{ fontWeight: 700, color: "#0F3E36", fontSize: 15.5 }}>
                {formatINR(appointment.consultationFee)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>✓</span> Status
              </span>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          border: "1px solid #E5E7EB",
          padding: "24px 28px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          marginBottom: 20,
        }}
        id="payment-card-panel"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 18 }}>💳</span>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#111827" }}>Payment</h2>
        </div>

        {isPatient && (
          <PaymentPanel
            appointment={appointment}
            paid={paid}
            setPaid={setPaid}
            doctorUser={doctorUser}
            onPaid={load}
          />
        )}
        {isDoctor && <DoctorPaymentView appointment={appointment} paid={paid} />}
      </div>

      <PrescriptionPanel appointment={appointment} isDoctor={isDoctor} isPatient={isPatient} />

      {isActive && (
        <div style={{ marginTop: 20, marginBottom: 28 }}>
          <ActionsPanel
            appointment={appointment}
            isPatient={isPatient}
            isDoctor={isDoctor}
            slotDateStr={slotDateStr}
            onChanged={load}
            onCancelled={() => navigate("/appointments")}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginTop: 32,
          paddingTop: 20,
          borderTop: "1px solid #E5E7EB",
        }}
      >
        <Link
          to={doctorDocId ? `/doctors/${doctorDocId}` : "/doctors"}
          style={{
            background: "#0F3E36",
            color: "#FFFFFF",
            padding: "13px 26px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14.5,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(15, 62, 54, 0.2)",
            transition: "all 0.15s ease",
          }}
        >
          <span>📅</span> Book Another Appointment
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .appointment-details-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

function PaymentPanel({ appointment, paid, setPaid, doctorUser, onPaid }) {
  const toast = useToast();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);

  if (appointment.status === "cancelled") return null;

  const handlePay = async () => {
    setPaying(true);
    try {
      let order;
      try {
        order = await api.createOrder(appointment._id);
      } catch (err) {
        if (err.status === 400 && /already been completed/i.test(err.message || "")) {
          markPaid(appointment._id);
          setPaid(true);
          toast.info("This appointment is already paid for.");
          return;
        }
        throw err;
      }

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "MediConnect",
        description: `Consultation with Dr. ${doctorUser.username || ""}`.trim(),
        prefill: { name: user?.username, email: user?.email },
        theme: { color: "#0F3E36" },
        handler: async (response) => {
          try {
            await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appointment._id,
            });
            markPaid(appointment._id);
            setPaid(true);
            toast.success("Payment verified. Appointment confirmed.");
            if (onPaid) await onPaid();
          } catch (err) {
            toast.error(err.message || "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed. You can try again.");
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      toast.error(err.message || "Could not start payment.");
    } finally {
      setPaying(false);
    }
  };

  if (paid) {
    return (
      <div
        style={{
          background: "#F0FDF4",
          border: "1px solid #DCFCE7",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#16A34A",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827", marginBottom: 2 }}>
              Payment verified for this appointment
            </div>
            <div style={{ fontSize: 13, color: "#4B5563" }}>
              {formatINR(appointment.consultationFee)} received successfully.
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span
            style={{
              background: "#DCFCE7",
              color: "#15803D",
              padding: "3px 10px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              display: "inline-block",
              marginBottom: 2,
            }}
          >
            Settled
          </span>
          <div style={{ fontSize: 12, color: "#6B7280" }}>
            {formatDate(appointment.slotDate)} · {formatTime(appointment.slotTime)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 6 }}>
      {appointment.status === "pending" && (
        <div className="alert alert-warning" style={{ marginBottom: 14 }}>
          <strong>Payment Pending:</strong> Complete payment to confirm your appointment and unlock the video consultation room.
        </div>
      )}
      <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 14 }}>
        Secured by Razorpay. Amount is set according to doctor's verified consultation fee.
      </p>
      <button
        type="button"
        className="btn btn-rust"
        onClick={handlePay}
        disabled={paying}
        style={{
          background: "#0F3E36",
          padding: "12px 24px",
          fontWeight: 700,
          borderRadius: 8,
          fontSize: 14.5,
        }}
      >
        {paying ? "Opening Checkout…" : `💳 Pay ${formatINR(appointment.consultationFee)} & Confirm`}
      </button>
    </div>
  );
}

function DoctorPaymentView({ appointment, paid }) {
  if (appointment.status === "cancelled") return null;

  return (
    <div>
      {paid ? (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #DCFCE7",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>Payment Received</div>
            <div style={{ color: "#4B5563", fontSize: 13 }}>
              Patient has completed payment of {formatINR(appointment.consultationFee)} for this consultation.
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info" style={{ margin: 0 }}>
          ⏳ Payment pending — patient has not completed payment yet ({formatINR(appointment.consultationFee)}).
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prescription Panel                                                 */
/* ------------------------------------------------------------------ */

function PrescriptionPanel({ appointment, isDoctor, isPatient }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try {
      const res = await api.getPrescriptionByAppointmentId(appointment._id);
      setPrescription(res.data);
    } catch (err) {
      if (err.status === 404) setPrescription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment._id]);

  if (loading) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        border: "1px solid #E5E7EB",
        padding: "26px 28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>💊</span>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#111827" }}>Prescription</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Digital Rx Record</span>
          {isDoctor && appointment.status === "completed" && prescription && !editing && (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
              Edit Rx
            </button>
          )}
        </div>
      </div>

      {!prescription && !editing && (
        <div style={{ padding: "8px 0" }}>
          {appointment.status !== "completed" ? (
            <p style={{ color: "#6B7280", fontSize: 13.5, margin: 0 }}>
              Digital prescription will be issued once the doctor completes the consultation.
            </p>
          ) : isDoctor ? (
            <PrescriptionForm
              appointmentId={appointment._id}
              onSaved={(p) => {
                setPrescription(p);
                toast.success("Prescription created.");
              }}
            />
          ) : (
            <p style={{ color: "#6B7280", fontSize: 13.5, margin: 0 }}>No prescription has been issued yet.</p>
          )}
        </div>
      )}

      {prescription && !editing && (
        <div>
          {/* Primary Assessment */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", fontWeight: 700, marginBottom: 6 }}>
              Primary Assessment
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Diagnosis:</span>
              <span
                style={{
                  background: "#F3F4F6",
                  color: "#111827",
                  padding: "4px 14px",
                  borderRadius: 9999,
                  fontWeight: 600,
                  fontSize: 13.5,
                }}
              >
                {prescription.diagnosis}
              </span>
            </div>
          </div>

          {/* Medicines List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {prescription.medicines?.map((m, i) => (
              <div
                key={i}
                style={{
                  background: "#FAFAF9",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15.5, color: "#111827" }}>
                    <span>💊</span>
                    <span>{m.name} — {m.dosage}</span>
                  </div>
                  <span
                    style={{
                      background: "#F3F4F6",
                      color: "#4B5563",
                      fontSize: 11.5,
                      fontWeight: 500,
                      padding: "2px 10px",
                      borderRadius: 9999,
                    }}
                  >
                    Oral Tablet
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "5px 12px", borderRadius: 8, fontSize: 12.5, color: "#374151" }}>
                    📅 Schedule: <strong>{m.frequency}</strong> (Morning - Afternoon - Night)
                  </span>
                  <span style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "5px 12px", borderRadius: 8, fontSize: 12.5, color: "#374151" }}>
                    ⏱ Duration: <strong>{m.duration}</strong>
                  </span>
                  {m.instructions && (
                    <span style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "5px 12px", borderRadius: 8, fontSize: 12.5, color: "#374151" }}>
                      📄 Notes: <strong>{m.instructions}</strong>
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                  Raw entry: {m.frequency} • {m.duration} {m.instructions ? `• ${m.instructions}` : ""}
                </div>
              </div>
            ))}
          </div>

          {prescription.followUpDate && (
            <div style={{ marginTop: 14, fontSize: 13, color: "#4B5563" }}>
              🗓️ <strong>Recommended Follow-up:</strong> {formatDate(prescription.followUpDate)}
            </div>
          )}
        </div>
      )}

      {editing && prescription && (
        <PrescriptionForm
          appointmentId={appointment._id}
          existing={prescription}
          onSaved={(p) => {
            setPrescription(p);
            setEditing(false);
            toast.success("Prescription updated.");
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function PrescriptionForm({ appointmentId, existing, onSaved, onCancel }) {
  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis || "");
  const [followUpDate, setFollowUpDate] = useState(existing?.followUpDate ? existing.followUpDate.slice(0, 10) : "");
  const [medicines, setMedicines] = useState(
    existing?.medicines?.length
      ? existing.medicines.map((m) => ({ ...m }))
      : [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addRow = () => setMedicines((m) => [...m, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const updateRow = (i, key, value) => setMedicines((m) => m.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeRow = (i) => setMedicines((m) => m.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      diagnosis,
      medicines: medicines.filter((m) => m.name.trim()),
      followUpDate: followUpDate || undefined,
    };
    try {
      let res;
      if (existing) {
        res = await api.updatePrescription(existing._id, payload);
      } else {
        res = await api.createPrescription({ appointmentId, ...payload });
      }
      onSaved(res.data);
    } catch (err) {
      setError(err.message || "Could not save prescription.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label>Diagnosis</label>
        <textarea required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
      </div>

      <div className="spread" style={{ marginBottom: 10 }}>
        <label className="small-caps" style={{ margin: 0 }}>Medicines</label>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>+ Add Medicine</button>
      </div>

      {medicines.map((m, i) => (
        <div key={i} className="card card-pad" style={{ marginBottom: 10, background: "var(--paper)" }}>
          <div className="field-row">
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Name</label>
              <input required value={m.name} onChange={(e) => updateRow(i, "name", e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Dosage</label>
              <input required placeholder="500mg" value={m.dosage} onChange={(e) => updateRow(i, "dosage", e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Frequency</label>
              <input required placeholder="1-0-1" value={m.frequency} onChange={(e) => updateRow(i, "frequency", e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Duration</label>
              <input required placeholder="5 days" value={m.duration} onChange={(e) => updateRow(i, "duration", e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Instructions (optional)</label>
            <input value={m.instructions || ""} onChange={(e) => updateRow(i, "instructions", e.target.value)} />
          </div>
          {medicines.length > 1 && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeRow(i)}>Remove</button>
          )}
        </div>
      ))}

      <div className="field">
        <label>Follow-up Date (optional)</label>
        <input type="date" min={todayISODate()} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
      </div>

      <div className="row">
        <button className="btn btn-rust" type="submit" disabled={saving} style={{ background: "#0F3E36" }}>
          {saving ? "Saving…" : existing ? "Save Changes" : "Create Prescription"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Actions Panel: Reschedule / Cancel / Status                        */
/* ------------------------------------------------------------------ */

function ActionsPanel({ appointment, isPatient, isDoctor, slotDateStr, onChanged, onCancelled }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [slotDate, setSlotDate] = useState(appointment.slotDate.slice(0, 10));
  const [slotTime, setSlotTime] = useState(appointment.slotTime);
  const [error, setError] = useState("");

  const doctor = appointment.doctorId || {};
  const weekday = weekdayFor(slotDate);
  const daySchedule = useMemo(() => doctor?.availability?.find((a) => a.day === weekday), [doctor, weekday]);
  const slots = useMemo(
    () => (daySchedule ? generateSlots(daySchedule.startTime, daySchedule.endTime, daySchedule.slotDuration || 30) : []),
    [daySchedule]
  );

  const handleCancel = async () => {
    if (!window.confirm("Cancel this appointment? This cannot be undone.")) return;
    setBusy(true);
    try {
      await api.cancelAppointment(appointment._id);
      toast.success("Appointment cancelled.");
      onChanged();
    } catch (err) {
      toast.error(err.message || "Could not cancel.");
    } finally {
      setBusy(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.updateAppointment(appointment._id, { slotDate, slotTime });
      toast.success("Appointment rescheduled.");
      setShowReschedule(false);
      onChanged();
    } catch (err) {
      setError(err.message || "Could not reschedule.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status) => {
    setBusy(true);
    try {
      await api.updateAppointment(appointment._id, { status });
      toast.success(`Marked as ${status}.`);
      onChanged();
    } catch (err) {
      toast.error(err.message || "Could not update status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        border: "1px solid #E5E7EB",
        padding: "20px 24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280" }}>
          Appointment Actions
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          {isDoctor && appointment.status === "pending" && (
            <button className="btn btn-primary btn-sm" onClick={() => setStatus("confirmed")} disabled={busy}>
              Confirm Appointment
            </button>
          )}
          {isDoctor && appointment.status === "confirmed" && (
            <button className="btn btn-teal btn-sm" onClick={() => setStatus("completed")} disabled={busy}>
              Mark as Completed
            </button>
          )}
          {isPatient && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowReschedule((s) => !s)} disabled={busy}>
              {showReschedule ? "Close Reschedule" : "Reschedule Slot"}
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={busy}>
            Cancel Appointment
          </button>
        </div>
      </div>

      {showReschedule && (
        <form onSubmit={handleReschedule} style={{ marginTop: 18, borderTop: "1px dashed #E5E7EB", paddingTop: 16 }}>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>New Date</label>
              <input
                type="date"
                min={todayISODate()}
                value={slotDate}
                onChange={(e) => {
                  setSlotDate(e.target.value);
                  setSlotTime("");
                }}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB" }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>New Time</label>
              <select
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB" }}
                required
              >
                <option value="">Select a time…</option>
                {slots.map((s) => (
                  <option key={s} value={s}>{formatTime(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-rust btn-sm" type="submit" disabled={busy} style={{ background: "#0F3E36" }}>
            {busy ? "Saving…" : "Save New Schedule"}
          </button>
        </form>
      )}
    </div>
  );
}
