import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { formatDate, formatDateTime, formatINR, formatTime } from "../lib/helpers";

const RECORD_TYPES = [
  { value: "lab_report", label: "Lab Report" },
  { value: "x_ray", label: "X-Ray" },
  { value: "prescription", label: "Prescription" },
  { value: "mri_scan", label: "MRI Scan" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "other", label: "Other" },
];

export default function MedicalRecords() {
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  // Active Tab: "billing" (Invoices & Receipts) | "records" (Clinical Documents)
  const [activeTab, setActiveTab] = useState("billing");

  // Records state
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", recordType: "lab_report", description: "" });
  const [error, setError] = useState("");

  // Payments / Receipts state
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const res = await api.getMyMedicalRecords();
      setRecords(res.data || []);
    } catch (err) {
      toast.error(err.message || "Could not load medical records.");
    } finally {
      setLoadingRecords(false);
    }
  };

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.getMyPayments();
      setPayments(res.data || []);
    } catch (err) {
      toast.error(err.message || "Could not load payment receipts.");
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File is too large. Maximum allowed size is 25MB.");
      return;
    }
    if (!form.title.trim()) {
      setError("Please provide a title.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("document", file);
      fd.append("title", form.title.trim());
      fd.append("recordType", form.recordType);
      if (form.description) fd.append("description", form.description);
      await api.uploadMedicalRecord(fd);
      toast.success("Medical record uploaded.");
      setForm({ title: "", recordType: "lab_report", description: "" });
      if (fileRef.current) fileRef.current.value = "";
      loadRecords();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Delete this medical record permanently?")) return;
    try {
      await api.deleteMedicalRecord(id);
      toast.success("Record deleted.");
      setRecords((r) => r.filter((rec) => rec._id !== id));
    } catch (err) {
      toast.error(err.message || "Could not delete record.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container page">
      {/* Header */}
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <span className="eyebrow">Patient Vault</span>
          <h1 style={{ fontSize: 30, margin: "10px 0 0" }}>Billing &amp; Medical Records</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--line)", marginBottom: 26, paddingBottom: 2 }}>
        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "billing" ? "2.5px solid var(--pine)" : "2.5px solid transparent",
            padding: "10px 18px",
            fontWeight: activeTab === "billing" ? 700 : 500,
            color: activeTab === "billing" ? "var(--pine)" : "var(--ink-soft)",
            cursor: "pointer",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🧾 Payment Receipts &amp; Invoices</span>
          {payments.length > 0 && (
            <span className="badge badge-teal" style={{ fontSize: 11, padding: "2px 7px" }}>
              {payments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("records")}
          style={{
            background: "none",
            border: "none",
            borderBottom: activeTab === "records" ? "2.5px solid var(--pine)" : "2.5px solid transparent",
            padding: "10px 18px",
            fontWeight: activeTab === "records" ? 700 : 500,
            color: activeTab === "records" ? "var(--pine)" : "var(--ink-soft)",
            cursor: "pointer",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>📁 Clinical Documents &amp; Reports</span>
          {records.length > 0 && (
            <span className="badge badge-neutral" style={{ fontSize: 11, padding: "2px 7px" }}>
              {records.length}
            </span>
          )}
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: BILLING & PAYMENT RECEIPTS                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "billing" && (
        <div>
          {loadingPayments ? (
            <Loader label="Fetching payment receipts" />
          ) : payments.length === 0 ? (
            <EmptyState
              title="No payment receipts found"
              hint="When you book and pay for consultations, your official payment receipts and invoices will be saved here automatically."
            />
          ) : (
            <div className="grid-2">
              {payments.map((p) => {
                const appt = p.appointmentId || {};
                const doctor = appt.doctorId || {};
                const doctorUser = doctor.userId || {};

                return (
                  <div key={p._id} className="card card-pad" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div className="spread" style={{ marginBottom: 12 }}>
                        <span className="badge badge-teal">Paid &amp; Confirmed</span>
                        <span className="faint" style={{ fontSize: 13 }}>{formatDate(p.createdAt)}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        {doctorUser.profilePicUrl ? (
                          <img
                            src={doctorUser.profilePicUrl}
                            alt={`Dr. ${doctorUser.username || "Doctor"}`}
                            style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--line)" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: "50%",
                              background: "var(--pine-tint)",
                              color: "var(--pine)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 18,
                              border: "1px solid var(--line)",
                            }}
                          >
                            {doctorUser.username ? doctorUser.username[0].toUpperCase() : "D"}
                          </div>
                        )}
                        <div>
                          <h3 style={{ fontSize: 17, marginBottom: 2 }}>Dr. {doctorUser.username || "Doctor"}</h3>
                          <p className="faint" style={{ margin: 0, fontSize: 13 }}>{doctor.specialization || "Telehealth Consultation"}</p>
                        </div>
                      </div>

                      <div className="ledger-row" style={{ padding: "8px 0" }}>
                        <span className="ledger-label">Consultation Schedule</span>
                        <span className="ledger-value">
                          {appt.slotDate ? `${formatDate(appt.slotDate)} · ${formatTime(appt.slotTime)}` : "—"}
                        </span>
                      </div>

                      <div className="ledger-row" style={{ padding: "8px 0" }}>
                        <span className="ledger-label">Amount Paid</span>
                        <span className="ledger-value" style={{ fontWeight: 700, color: "var(--teal-dark)" }}>
                          {formatINR(p.amount)}
                        </span>
                      </div>

                      <div className="ledger-row" style={{ padding: "8px 0", borderBottom: "none" }}>
                        <span className="ledger-label">Payment ID</span>
                        <span className="ledger-value" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {p.razorpayPaymentId || "—"}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-block"
                        onClick={() => setSelectedReceipt(p)}
                      >
                        📄 View &amp; Print Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: CLINICAL DOCUMENTS & REPORTS                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "records" && (
        <div>
          <form onSubmit={handleUpload} className="card card-pad" style={{ marginBottom: 28 }}>
            <span className="eyebrow">Upload a Document</span>
            {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}
            <div className="field-row" style={{ marginTop: 14 }}>
              <div className="field">
                <label>Title</label>
                <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Blood Test — Jan 2026" />
              </div>
              <div className="field">
                <label>Type</label>
                <select value={form.recordType} onChange={(e) => setForm((f) => ({ ...f, recordType: e.target.value }))}>
                  {RECORD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>File (PDF, JPG, PNG, WEBP — max 25MB)</label>
                <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp" required />
              </div>
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Add doctor notes or context..." />
            </div>
            <button className="btn btn-rust" type="submit" disabled={uploading}>
              {uploading ? "Uploading…" : "Upload Record"}
            </button>
          </form>

          {loadingRecords ? (
            <Loader label="Fetching records" />
          ) : records.length === 0 ? (
            <EmptyState title="No medical records uploaded" hint="Upload lab reports, scans, or discharge summaries here." />
          ) : (
            <div className="grid-3">
              {records.map((r) => (
                <div key={r._id} className="card card-pad">
                  <div className="spread" style={{ marginBottom: 10 }}>
                    <span className="badge badge-neutral">{RECORD_TYPES.find((t) => t.value === r.recordType)?.label || r.recordType}</span>
                    <span className="faint">{formatDate(r.recordDate)}</span>
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 6 }}>{r.title}</h3>
                  {r.description && <p className="faint" style={{ marginBottom: 10 }}>{r.description}</p>}
                  <div className="row">
                    <a href={r.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      View File
                    </a>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRecord(r._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RECEIPT / INVOICE MODAL                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedReceipt && (
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
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: 580,
              width: "100%",
              background: "#FFFFFF",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #0F3E36 0%, #185A4F 100%)",
                padding: "24px 30px",
                color: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🩺</span>
                  <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>MediConnect</h2>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#A7F3D0" }}>
                  Official Telehealth Consultation Receipt
                </p>
              </div>
              <span className="badge badge-teal" style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF", border: "none" }}>
                PAID
              </span>
            </div>

            {/* Modal Body / Invoice Content */}
            <div style={{ padding: "26px 30px" }}>
              <div className="spread" style={{ marginBottom: 20, borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
                <div>
                  <span className="faint" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Receipt No.</span>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                    INV-{selectedReceipt._id.slice(-8).toUpperCase()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="faint" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Issue Date</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                    {formatDateTime(selectedReceipt.createdAt)}
                  </div>
                </div>
              </div>

              {/* Patient & Doctor Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div style={{ background: "#F9FAFB", padding: "12px 16px", borderRadius: 8 }}>
                  <span className="faint" style={{ fontSize: 11, textTransform: "uppercase" }}>Billed To (Patient)</span>
                  <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>
                    {user?.username || "Patient"}
                  </div>
                  <div className="faint" style={{ fontSize: 12 }}>{user?.email}</div>
                </div>

                <div style={{ background: "#F9FAFB", padding: "12px 16px", borderRadius: 8 }}>
                  <span className="faint" style={{ fontSize: 11, textTransform: "uppercase" }}>Doctor / Provider</span>
                  <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>
                    Dr. {selectedReceipt.appointmentId?.doctorId?.userId?.username || "Doctor"}
                  </div>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {selectedReceipt.appointmentId?.doctorId?.specialization || "Telehealth Specialist"}
                  </div>
                </div>
              </div>

              {/* Consultation Particulars */}
              <div style={{ marginBottom: 24 }}>
                <div className="ledger-row" style={{ padding: "10px 0" }}>
                  <span className="ledger-label">Appointment Schedule</span>
                  <span className="ledger-value">
                    {formatDate(selectedReceipt.appointmentId?.slotDate)} at {formatTime(selectedReceipt.appointmentId?.slotTime)}
                  </span>
                </div>
                <div className="ledger-row" style={{ padding: "10px 0" }}>
                  <span className="ledger-label">Payment Gateway</span>
                  <span className="ledger-value">Razorpay Online</span>
                </div>
                <div className="ledger-row" style={{ padding: "10px 0" }}>
                  <span className="ledger-label">Razorpay Payment ID</span>
                  <span className="ledger-value" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {selectedReceipt.razorpayPaymentId || "—"}
                  </span>
                </div>
                <div className="ledger-row" style={{ padding: "10px 0" }}>
                  <span className="ledger-label">Razorpay Order ID</span>
                  <span className="ledger-value" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {selectedReceipt.razorpayOrderId || "—"}
                  </span>
                </div>
                <div className="ledger-row" style={{ padding: "12px 0", borderBottom: "none" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Total Consultation Fee</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--teal-dark)" }}>
                    {formatINR(selectedReceipt.amount)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedReceipt(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-rust"
                  onClick={handlePrint}
                >
                  🖨️ Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
