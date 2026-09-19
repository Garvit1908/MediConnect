import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import Loader from "../components/Loader";
import { formatINR, formatTime, generateSlots, todayISODate, weekdayFor } from "../lib/helpers";

export default function DoctorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [slotDate, setSlotDate] = useState(todayISODate());
  const [slotTime, setSlotTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);

  const handleAdminToggleVerify = async (newStatus) => {
    setAdminBusy(true);
    try {
      const res = await api.verifyDoctor(doctor._id, newStatus);
      setDoctor((prev) => ({ ...prev, isVerified: res.data.isVerified }));
      if (newStatus) {
        toast.success(`Dr. ${doctor.userId?.username || "Doctor"} is now verified! Patients can book.`);
      } else {
        toast.info(`Dr. ${doctor.userId?.username || "Doctor"} verification revoked.`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update verification.");
    } finally {
      setAdminBusy(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.getDoctorById(id);
        setDoctor(res.data);
      } catch (err) {
        toast.error(err.message || "Doctor not found.");
      } finally {
        setLoading(false);
      }
    })();

  }, [id]);

  useEffect(() => {
    if (user?.role !== "patient") return;
    (async () => {
      try {
        await api.getMyPatientProfile();
        setHasProfile(true);
      } catch (err) {
        if (err.status === 404) setHasProfile(false);
      }
    })();
  }, [user]);

  const quickDates = useMemo(() => {
    if (!doctor?.availability || doctor.availability.length === 0) return [];
    const availableDaysSet = new Set(doctor.availability.map((a) => a.day));
    const dates = [];
    const base = new Date();

    for (let i = 0; i < 14 && dates.length < 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dayNameShort = d.toLocaleDateString("en-US", { weekday: "short" });

      if (availableDaysSet.has(dayNameShort)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const iso = `${year}-${month}-${day}`;
        const dayLabel = i === 0 ? "TODAY" : dayNameShort.toUpperCase();
        const subLabel = `${dayNameShort}, ${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
        dates.push({ iso, dayLabel, subLabel });
      }
    }
    return dates;
  }, [doctor]);

  useEffect(() => {
    if (doctor?.availability?.length > 0) {
      const todayDay = weekdayFor(todayISODate());
      const isTodayWorking = doctor.availability.some((a) => a.day === todayDay);
      if (!isTodayWorking && quickDates.length > 0) {
        setSlotDate(quickDates[0].iso);
      }
    }
  }, [doctor, quickDates]);

  const weekday = weekdayFor(slotDate);
  const daySchedule = useMemo(
    () => doctor?.availability?.find((a) => a.day === weekday),
    [doctor, weekday]
  );
  const isAvailableDay = Boolean(daySchedule);

  const slots = useMemo(() => {
    if (!daySchedule) return [];
    return generateSlots(daySchedule.startTime, daySchedule.endTime, daySchedule.slotDuration || 30);
  }, [daySchedule]);

  const morningSlots = useMemo(
    () => slots.filter((s) => Number(s.split(":")[0]) < 12),
    [slots]
  );
  const afternoonSlots = useMemo(
    () => slots.filter((s) => Number(s.split(":")[0]) >= 12),
    [slots]
  );

  const handleBook = async (e) => {
    e.preventDefault();
    setError("");
    if (!slotTime) {
      setError("Please choose a time slot.");
      return;
    }
    setBooking(true);
    try {
      const res = await api.bookAppointment({ doctorId: id, slotDate, slotTime });
      if (res.data?.status === "pending") {
        toast.info("Slot reserved! Please complete payment to confirm your appointment.");
      } else {
        toast.success("Appointment booked and confirmed.");
      }
      navigate(`/appointments/${res.data._id}`);
    } catch (err) {
      setError(err.message || "Could not book this slot.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="container page"><Loader label="Loading doctor profile" /></div>;
  if (!doctor) return <div className="container page"><div className="alert alert-error">Doctor not found.</div></div>;

  const doctorUser = doctor.userId || {};

  return (
    <div className="container page" style={{ maxWidth: 1220, paddingBottom: 64 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 32, alignItems: "flex-start" }} className="booking-layout-grid">

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 20px -2px rgba(17, 24, 39, 0.04)",
              padding: 28,
              position: "relative",
              overflow: "hidden",
            }}
          >

            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 220,
                height: 180,
                background: "radial-gradient(circle at 100% 0%, rgba(15, 62, 54, 0.05) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

              <div style={{ position: "relative", flexShrink: 0 }}>
                {doctorUser.profilePicUrl && !imgError ? (
                  <img
                    src={doctorUser.profilePicUrl}
                    alt={`Dr. ${doctorUser.username || "Doctor"}`}
                    onError={() => setImgError(true)}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 16,
                      objectFit: "cover",
                      border: "1.5px solid #E5E7EB",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 16,
                      background: "var(--pine-tint)",
                      color: "var(--pine)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 30,
                      fontFamily: "var(--font-display)",
                      border: "1.5px solid #E5E7EB",
                    }}
                  >
                    {doctorUser.username ? doctorUser.username[0].toUpperCase() : "D"}
                  </div>
                )}
                {doctor.isVerified && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -5,
                      right: -5,
                      background: "#0F3E36",
                      color: "#FFFFFF",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #FFFFFF",
                      fontSize: 12,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    }}
                    title="Verified Specialist"
                  >
                    ✓
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                  <span
                    style={{
                      background: "#ECFDF5",
                      color: "#065F46",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 9999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                    Accepting New Patients
                  </span>
                  <span
                    style={{
                      background: "#F3F4F6",
                      color: "#374151",
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: 9999,
                    }}
                  >
                    {doctor.specialization}
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: 26,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    margin: "0 0 6px",
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Dr. {doctorUser.username || "Doctor"}
                </h1>
                <p style={{ color: "#4B5563", fontSize: 13.5, margin: 0, lineHeight: 1.45 }}>
                  {doctor.qualification || "MD, MS • Certified Specialist"}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid #F3F4F6",
              }}
            >
              <div style={{ background: "#F9FAFB", padding: "14px 16px", borderRadius: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 4 }}>
                  Specialization
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                  {doctor.specialization}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Clinical Care</div>
              </div>

              <div style={{ background: "#F9FAFB", padding: "14px 16px", borderRadius: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 4 }}>
                  Experience
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
                  {doctor.experience || 4}+ Years
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Clinical practice</div>
              </div>

              <div style={{ background: "#F9FAFB", padding: "14px 16px", borderRadius: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 4 }}>
                  Standard Fee
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0F3E36", marginBottom: 2 }}>
                  {formatINR(doctor.consultationFee)}
                </div>
                <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Digital Rx incl.</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 20px -2px rgba(17, 24, 39, 0.04)",
              padding: 28,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: "0 0 4px", color: "var(--ink)" }}>
                  Weekly Availability
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>
                  Recurring outpatient consultation hours &amp; clinic rotations
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--ink-soft)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                All sessions {doctor.availability?.[0]?.slotDuration || 30} min duration
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {doctor.availability && doctor.availability.length > 0 ? (
                doctor.availability.map((sched) => {
                  const isTodayRow = sched.day === weekday;
                  return (
                    <div
                      key={sched.day}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: isTodayRow ? "#F4F8F6" : "#FAFAF8",
                        border: isTodayRow ? "1px solid rgba(15, 62, 54, 0.15)" : "1px solid transparent",
                        fontSize: 13.5,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 140 }}>
                        <span style={{ fontWeight: 700, color: isTodayRow ? "#0F3E36" : "#111827", width: 38 }}>{sched.day}</span>
                        <span
                          style={{
                            fontSize: 11.5,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "#E5E7EB",
                            color: "#374151",
                            fontWeight: 500,
                          }}
                        >
                          {sched.day === "Wed" ? "Tele + Clinic" : "Regular Rota"}
                        </span>
                      </div>

                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#374151" }}>
                        {sched.startTime} – {sched.endTime} • {sched.slotDuration || 30}m slots
                      </div>

                      <div>
                        {isTodayRow ? (
                          <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 9999 }}>
                            Available Today
                          </span>
                        ) : (
                          <span style={{ background: "#ECFDF5", color: "#065F46", fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 9999 }}>
                            Open
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "#6B7280", fontSize: 13, padding: "8px 0" }}>No weekly schedule configured.</div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 20,
            border: "1px solid #E5E7EB",
            boxShadow: "0 10px 30px -4px rgba(17, 24, 39, 0.06)",
            padding: 28,
            position: "sticky",
            top: 24,
          }}
        >

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <span
                style={{
                  background: "#ECFDF5",
                  color: "#065F46",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 9999,
                  display: "inline-block",
                  marginBottom: 6,
                }}
              >
                Direct Appointment
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 600,
                  margin: 0,
                  color: "var(--ink)",
                }}
              >
                Choose a slot
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B7280" }}>
                Total Consultation
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0F3E36", fontFamily: "var(--font-display)", lineHeight: 1.2 }}>
                {formatINR(doctor.consultationFee)}
              </div>
            </div>
          </div>

          {!user && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <span>
                <Link to="/login" state={{ from: { pathname: `/doctors/${id}` } }} style={{ fontWeight: 600, color: "#0F3E36" }}>
                  Log in
                </Link>{" "}
                as a patient to book this doctor.
              </span>
            </div>
          )}

          {user && user.role === "doctor" && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>Doctor accounts cannot book appointments.</div>
          )}

          {user && user.role === "admin" && (
            <div
              className="card card-pad"
              style={{
                background: "#F0FDF4",
                borderColor: "#BBF7D0",
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <strong style={{ fontSize: 14, color: "#166534" }}>Admin Management Console</strong>
              </div>
              <p style={{ fontSize: 13, color: "#374151", margin: "0 0 14px" }}>
                Current status:{" "}
                <strong>{doctor.isVerified ? "Verified Practitioner ✅" : "Under Verification ⏳"}</strong>
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {doctor.isVerified ? (
                  <button
                    type="button"
                    disabled={adminBusy}
                    onClick={() => handleAdminToggleVerify(false)}
                    className="btn"
                    style={{
                      background: "#FEF2F2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "8px 14px",
                      borderRadius: 8,
                    }}
                  >
                    {adminBusy ? "Updating…" : "Revoke Verification"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={adminBusy}
                    onClick={() => handleAdminToggleVerify(true)}
                    className="btn"
                    style={{
                      background: "#059669",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "8px 16px",
                      borderRadius: 8,
                    }}
                  >
                    {adminBusy ? "Verifying…" : "✓ Approve & Verify Doctor"}
                  </button>
                )}
                <Link
                  to="/admin"
                  className="btn btn-secondary"
                  style={{ fontSize: 13, padding: "8px 14px", textDecoration: "none" }}
                >
                  Go to Admin Portal
                </Link>
              </div>
            </div>
          )}

          {user && user.role === "patient" && !hasProfile && (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <span>
                Complete your <Link to="/profile" style={{ fontWeight: 600, color: "#0F3E36" }}>patient profile</Link> before booking.
              </span>
            </div>
          )}

          {!doctor.isVerified && (
            <div className="alert alert-warning" style={{ background: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E", marginBottom: 16 }}>
              ⏳ <strong>Under Verification:</strong> This doctor is currently awaiting administrative license verification.
            </div>
          )}

          {user && user.role === "patient" && hasProfile && doctor.isVerified && (
            <form onSubmit={handleBook}>
              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 8, fontWeight: 600 }}>
                  1. Mode of Consultation
                </div>
                <div
                  style={{
                    border: "2px solid #0F3E36",
                    background: "#F9FAF9",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827", marginBottom: 2 }}>
                      HD Video Consult
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                      MediConnect WebRTC Room / In-App
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F3E36" }}>
                      {formatINR(doctor.consultationFee)}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "2px solid #0F3E36",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0F3E36" }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>
                    2. Select Consultation Date
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {weekday && `Falls on a ${weekday}`}
                  </div>
                </div>

                {quickDates.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${quickDates.length}, 1fr)`, gap: 8, marginBottom: 10 }}>
                    {quickDates.map((q) => {
                      const isSelected = slotDate === q.iso;
                      return (
                        <button
                          type="button"
                          key={q.iso}
                          onClick={() => {
                            setSlotDate(q.iso);
                            setSlotTime("");
                          }}
                          style={{
                            border: isSelected ? "2px solid #0F3E36" : "1px solid #E5E7EB",
                            background: isSelected ? "#FFFFFF" : "#FAFAF8",
                            borderRadius: 10,
                            padding: "10px 8px",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: isSelected ? "#0F3E36" : "#6B7280", letterSpacing: "0.05em" }}>
                            {q.dayLabel}
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#0F3E36" : "#111827", marginTop: 2 }}>
                            {q.subLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <input
                  type="date"
                  min={todayISODate()}
                  value={slotDate}
                  onChange={(e) => {
                    setSlotDate(e.target.value);
                    setSlotTime("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    fontSize: 13.5,
                    fontFamily: "var(--font-body)",
                    background: "#FFFFFF",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 10, fontWeight: 600 }}>
                  3. Choose Time Slot ({daySchedule?.slotDuration || 30}M)
                </div>

                {!isAvailableDay ? (
                  <div style={{ padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#B91C1C", fontSize: 13 }}>
                    Doctor does not practice on {weekday}s. Please pick an available date above.
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ padding: "12px 14px", background: "#F3F4F6", borderRadius: 10, color: "#6B7280", fontSize: 13 }}>
                    No slots configured for this day.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {morningSlots.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 }}>
                          Morning
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
                          {morningSlots.map((s) => {
                            const isSelected = slotTime === s;
                            return (
                              <button
                                type="button"
                                key={s}
                                onClick={() => setSlotTime(s)}
                                style={{
                                  padding: "9px 6px",
                                  borderRadius: 8,
                                  fontSize: 12.5,
                                  fontWeight: isSelected ? 700 : 500,
                                  border: isSelected ? "1.5px solid #0F3E36" : "1px solid #E5E7EB",
                                  background: isSelected ? "#0F3E36" : "#FFFFFF",
                                  color: isSelected ? "#FFFFFF" : "#1F2937",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: isSelected ? "0 2px 8px rgba(15, 62, 54, 0.2)" : "none",
                                }}
                              >
                                {formatTime(s)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {afternoonSlots.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 }}>
                          Afternoon
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
                          {afternoonSlots.map((s) => {
                            const isSelected = slotTime === s;
                            return (
                              <button
                                type="button"
                                key={s}
                                onClick={() => setSlotTime(s)}
                                style={{
                                  padding: "9px 6px",
                                  borderRadius: 8,
                                  fontSize: 12.5,
                                  fontWeight: isSelected ? 700 : 500,
                                  border: isSelected ? "1.5px solid #0F3E36" : "1px solid #E5E7EB",
                                  background: isSelected ? "#0F3E36" : "#FFFFFF",
                                  color: isSelected ? "#FFFFFF" : "#1F2937",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: isSelected ? "0 2px 8px rgba(15, 62, 54, 0.2)" : "none",
                                }}
                              >
                                {formatTime(s)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "16px 18px",
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#4B5563" }}>
                  <span>Doctor Consultation Fee</span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{formatINR(doctor.consultationFee)}.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#4B5563" }}>
                  <span>Digital Prescription &amp; Records</span>
                  <span style={{ fontWeight: 600, color: "#059669" }}>Free</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "#4B5563" }}>
                  <span>MediConnect Convenience Fee</span>
                  <span>
                    <span style={{ textDecoration: "line-through", color: "#9CA3AF", marginRight: 6 }}>₹49</span>
                    <span style={{ fontWeight: 600, color: "#059669" }}>₹0</span>
                  </span>
                </div>
                <div
                  style={{
                    borderTop: "1px solid #E5E7EB",
                    paddingTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 700,
                    fontSize: 15.5,
                    color: "#111827",
                  }}
                >
                  <span>Total Amount Payable</span>
                  <span style={{ color: "#0F3E36", fontSize: 17 }}>{formatINR(doctor.consultationFee)}.00</span>
                </div>
              </div>

              <button
                className="btn btn-rust btn-block"
                type="submit"
                disabled={booking || !slotTime}
                style={{
                  padding: "14px 20px",
                  fontSize: 15.5,
                  fontWeight: 700,
                  borderRadius: 10,
                  background: "#0F3E36",
                  boxShadow: "0 6px 18px rgba(15, 62, 54, 0.2)",
                  cursor: booking || !slotTime ? "not-allowed" : "pointer",
                  opacity: booking || !slotTime ? 0.65 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {booking ? "Reserving Slot…" : `Book for ${formatINR(doctor.consultationFee)} →`}
              </button>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  fontSize: 11.5,
                  color: "#6B7280",
                }}
              >
                <span>Accepted: UPI, Cards, NetBanking</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, color: "#374151" }}>
                  <span>▲</span> Secured by Razorpay
                </span>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .booking-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
