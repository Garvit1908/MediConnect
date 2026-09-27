import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import telehealthShowcase from "../assets/telehealth-showcase.jpg";
import telehealthDoctorImg from "../assets/telehealth-consultation-doctor.jpg";
import clinicalCareTeamImg from "../assets/clinical-care-team.png";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heroSymptom, setHeroSymptom] = useState("");

  const handleHeroSymptomSubmit = (e) => {
    e.preventDefault();
    if (heroSymptom.trim()) {
      navigate(`/doctors?symptoms=${encodeURIComponent(heroSymptom.trim())}`);
    } else {
      navigate("/doctors");
    }
  };

  const handleOpenAiReportModal = () => {
    window.dispatchEvent(
      new CustomEvent("open-mediconnect-ai", {
        detail: {
          prompt: "Please summarize my latest medical report: Fasting blood sugar 138 mg/dL, HbA1c 6.7%, Total Cholesterol 225 mg/dL."
        }
      })
    );
  };

  return (
    <div style={{ background: "var(--paper)" }}>
      {/* HERO SECTION */}
      <section className="container" style={{ maxWidth: 1320, paddingTop: 56, paddingBottom: 56 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1.15fr",
            gap: 48,
            alignItems: "center",
          }}
          className="hero-grid"
        >
          <div>
            {/* New Eyebrow Badge */}
            <div
              className="eyebrow"
              style={{
                marginBottom: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "var(--pine-tint)",
                color: "var(--pine)",
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 13
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 8px #10B981"
                }}
              />
              ✨ AI-Powered Clinical Telehealth Platform
            </div>

            <h1
              style={{
                fontSize: "clamp(36px, 4.4vw, 56px)",
                lineHeight: 1.12,
                margin: "0 0 20px",
                fontWeight: 500,
                letterSpacing: "-0.025em",
              }}
            >
              Quality care on your schedule, right from home.
            </h1>

            <p
              style={{
                fontSize: 16.5,
                color: "var(--ink-soft)",
                maxWidth: 510,
                lineHeight: 1.65,
                margin: "0 0 28px",
              }}
            >
              Consult board-certified doctors across leading clinical specialties. Get AI clinical symptom triage, instant lab report summaries, and encrypted browser consultations.
            </p>

            {/* Integrated Hero Quick Symptom Search */}
            <form
              onSubmit={handleHeroSymptomSubmit}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "6px 8px 6px 16px",
                border: "1.5px solid #CFE3DC",
                boxShadow: "0 10px 25px -4px rgba(15, 62, 54, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                maxWidth: 520,
                marginBottom: 28,
              }}
            >
              <span style={{ fontSize: 16 }}>🔍</span>
              <input
                type="text"
                value={heroSymptom}
                onChange={(e) => setHeroSymptom(e.target.value)}
                placeholder="Describe your symptoms (e.g. fever, migraine, knee pain)..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "var(--ink)",
                  background: "transparent",
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: 13.5, whiteSpace: "nowrap" }}
              >
                Find Specialist ✨
              </button>
            </form>

            <div className="row" style={{ gap: 14 }}>
              <Link
                to={user ? "/doctors" : "/login"}
                state={!user ? { from: { pathname: "/doctors" } } : undefined}
                className="btn btn-primary"
                style={{ padding: "12px 24px", fontSize: 14.5 }}
              >
                Browse All Doctors →
              </Link>
              <button
                type="button"
                onClick={handleOpenAiReportModal}
                className="btn btn-outline"
                style={{ padding: "12px 22px", fontSize: 14.5, borderColor: "var(--pine)", color: "var(--pine)" }}
              >
                ✨ AI Report Assistant
              </button>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div style={{ position: "relative" }}>
            <div
              className="card card-elevated"
              style={{
                overflow: "hidden",
                borderRadius: "22px",
                border: "1px solid var(--line)",
                boxShadow: "0 22px 50px -12px rgba(15, 62, 54, 0.16), 0 4px 16px rgba(0, 0, 0, 0.05)",
                background: "#FFFFFF",
                padding: 0,
                lineHeight: 0,
              }}
            >
              <img
                src={telehealthShowcase}
                alt="Doctor-Patient Video Consultation Showcase"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </div>

        {/* Trust Stats Row */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 36,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>
                1-on-1
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Direct WebRTC consultations</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>
                100%
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>End-to-end encrypted</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>
                AI-Ready
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Symptom &amp; Lab Triage</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              <span>🩺</span> Verified Doctors
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              <span>🔒</span> Encrypted Video Rooms
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              <span>📋</span> Instant E-Prescriptions
            </div>
          </div>
        </div>
      </section>

      {/* 4 BENTO TRUST REVIEWS (NO STARS, BRAND AUTHENTIC) */}
            {/* ============================================================ */}
      {/* OUR PROMISE SECTION (Inspired by clinical leadership showcase) */}
      {/* ============================================================ */}
      <section
        style={{
          padding: "70px 0",
          background: "#FFFFFF",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 56,
              alignItems: "center",
            }}
            className="our-promise-grid"
          >
            {/* Left: Stylized Diamond / Rounded Frame with Doctor & Nurse Team Photo */}
            <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {/* Soft decorative background accents */}
              <div
                style={{
                  position: "absolute",
                  width: 320,
                  height: 320,
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 62, 54, 0.08))",
                  borderRadius: 36,
                  transform: "rotate(45deg)",
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 140,
                  height: 140,
                  background: "rgba(167, 243, 208, 0.35)",
                  borderRadius: 24,
                  transform: "rotate(45deg) translate(-140px, -60px)",
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 100,
                  height: 100,
                  background: "rgba(15, 62, 54, 0.08)",
                  borderRadius: 18,
                  transform: "rotate(45deg) translate(140px, 120px)",
                  zIndex: 0,
                }}
              />

              {/* Main Image Container */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "min(400px, 90%)",
                  borderRadius: 28,
                  overflow: "hidden",
                  boxShadow: "0 24px 50px -12px rgba(15, 62, 54, 0.22), 0 4px 16px rgba(0, 0, 0, 0.06)",
                  border: "4px solid #FFFFFF",
                  background: "#F4F7F6",
                }}
              >
                <img
                  src={clinicalCareTeamImg}
                  alt="Doctor and clinical care team collaboratively reviewing patient health record on digital tablet"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>

            {/* Right: Authentic Clinical Commitments */}
            <div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#0F3E36",
                  background: "#EAF2EF",
                  padding: "5px 12px",
                  borderRadius: 9999,
                  marginBottom: 16,
                }}
              >
                OUR PROMISE
              </span>

              <h2
                style={{
                  fontSize: 32,
                  lineHeight: 1.25,
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: "0 0 28px",
                  letterSpacing: "-0.02em",
                }}
              >
                Accessible, Intelligent Care Built Around You
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Promise Point 1 */}
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#10B981",
                      marginTop: 7,
                      flexShrink: 0,
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>
                      Uncompromised Clinical Integrity
                    </h3>
                    <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
                      Every physician on our platform is rigorously verified and credentialed, ensuring you and your family always receive genuine, evidence-based medical care — never rushed advice or unverified opinions.
                    </p>
                  </div>
                </div>

                {/* Promise Point 2 */}
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#10B981",
                      marginTop: 7,
                      flexShrink: 0,
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>
                      Healthcare That Never Leaves You Waiting
                    </h3>
                    <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
                      Timely medical attention should never be out of reach. We break down geographic barriers and hospital queues so expert specialist care reaches you the moment symptoms strike.
                    </p>
                  </div>
                </div>

                {/* Promise Point 3 */}
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#10B981",
                      marginTop: 7,
                      flexShrink: 0,
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>
                      Absolute Privacy &amp; Patient Dignity
                    </h3>
                    <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
                      Your health journey belongs to you. Every video consultation, lab report, and medical record is protected with end-to-end encryption — remaining strictly confidential between you and your attending physician.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

<section style={{ padding: "64px 0", background: "#FFFFFF", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ maxWidth: 1280 }}>
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 40px" }}>
            <span className="eyebrow" style={{ marginBottom: 10 }}>Patient Stories</span>
            <h2 style={{ fontSize: 30, margin: "0 0 10px", fontWeight: 600, color: "var(--ink)" }}>
              Trusted by Patients Across India
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: 15, margin: 0 }}>
              Real healthcare journeys with AI clinical triage, verified specialists, and zero waiting rooms.
            </p>
          </div>

                    {/* 4-Card Bento Grid: Unified Deep Pine Green Theme */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {/* Card 1: AI Triage */}
            <div
              className="card card-pad"
              style={{
                background: "linear-gradient(135deg, #0F3E36 0%, #16564B 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 14px 30px -4px rgba(15, 62, 54, 0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 14,
                color: "#FFFFFF",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 9999,
                    background: "rgba(255, 255, 255, 0.18)",
                    color: "#A7F3D0",
                    marginBottom: 14,
                  }}
                >
                  ✨ AI Symptom Triage
                </span>
                <p style={{ fontSize: 14.5, color: "#FFFFFF", lineHeight: 1.6, fontStyle: "italic", margin: "0 0 20px" }}>
                  "I had sudden chest tightness and anxiety at work. The AI symptom matcher accurately guided me to a Cardiologist within 10 minutes. Genuine peace of mind."
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  RM
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#FFFFFF" }}>Rohan Mehra</div>
                  <div style={{ fontSize: 12, color: "#A7F3D0" }}>Software Engineer, Bengaluru</div>
                </div>
              </div>
            </div>

            {/* Card 2: Live Consultation */}
            <div
              className="card card-pad"
              style={{
                background: "linear-gradient(135deg, #0F3E36 0%, #16564B 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 14px 30px -4px rgba(15, 62, 54, 0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 14,
                color: "#FFFFFF",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 9999,
                    background: "rgba(255, 255, 255, 0.18)",
                    color: "#A7F3D0",
                    marginBottom: 14,
                  }}
                >
                  📹 Live Consultation
                </span>
                <p style={{ fontSize: 14.5, color: "#FFFFFF", lineHeight: 1.6, fontStyle: "italic", margin: "0 0 20px" }}>
                  "The peer-to-peer video call was crystal clear right in my browser, and I got a structured digital prescription with dosage instructions instantly."
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  PS
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#FFFFFF" }}>Priya Sharma</div>
                  <div style={{ fontSize: 12, color: "#A7F3D0" }}>Product Lead, Mumbai</div>
                </div>
              </div>
            </div>

            {/* Card 3: AI Report Summary */}
            <div
              className="card card-pad"
              style={{
                background: "linear-gradient(135deg, #0F3E36 0%, #16564B 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 14px 30px -4px rgba(15, 62, 54, 0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 14,
                color: "#FFFFFF",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 9999,
                    background: "rgba(255, 255, 255, 0.18)",
                    color: "#A7F3D0",
                    marginBottom: 14,
                  }}
                >
                  📋 AI Report Summary
                </span>
                <p style={{ fontSize: 14.5, color: "#FFFFFF", lineHeight: 1.6, fontStyle: "italic", margin: "0 0 20px" }}>
                  "Uploaded my blood test PDF — the AI report summarizer explained my elevated thyroid and cholesterol numbers in plain English before my doctor visit."
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  AI
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#FFFFFF" }}>Ananya Iyer</div>
                  <div style={{ fontSize: 12, color: "#A7F3D0" }}>Healthcare Consultant, Hyderabad</div>
                </div>
              </div>
            </div>

            {/* Card 4: 100% Verified Care */}
            <div
              className="card card-pad"
              style={{
                background: "linear-gradient(135deg, #0F3E36 0%, #16564B 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 14px 30px -4px rgba(15, 62, 54, 0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 14,
                color: "#FFFFFF",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 9999,
                    background: "rgba(255, 255, 255, 0.18)",
                    color: "#A7F3D0",
                    marginBottom: 14,
                  }}
                >
                  🛡️ 100% Verified Care
                </span>
                <p style={{ fontSize: 14.5, color: "#FFFFFF", lineHeight: 1.6, fontStyle: "italic", margin: "0 0 20px" }}>
                  "No 2-hour hospital queues, no unverified clinic listings. Every doctor is verified, and appointment slots are strictly conflict-free."
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  VS
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#FFFFFF" }}>Vikram Sen</div>
                  <div style={{ fontSize: 12, color: "#A7F3D0" }}>Operations Director, Delhi NCR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{ padding: "72px 0", background: "var(--paper)" }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <span className="eyebrow" style={{ marginBottom: 12 }}>Seamless Workflow</span>
            <h2 style={{ fontSize: 32, margin: "0 0 12px", fontWeight: 500, color: "var(--ink)" }}>
              Quality healthcare made simple, transparent, and fast
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
              Choose your physician, pick a convenient time slot, and consult securely from any device with immediate post-visit prescriptions.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
              alignItems: "center",
            }}
            className="how-it-works-grid"
          >
            {/* Left Image: Real Doctor Telehealth Consultation */}
            <div
              className="card"
              style={{
                borderRadius: "var(--radius-lg, 18px)",
                overflow: "hidden",
                border: "1px solid var(--line)",
                boxShadow: "0 18px 40px -10px rgba(15, 62, 54, 0.18)",
                background: "#0F3E36",
              }}
            >
              <img
                src={telehealthDoctorImg}
                alt="Doctor Conducting Real-Time Telehealth Video Consultation"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>

            {/* Right 4 Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid rgba(15,62,54,0.1)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: "var(--radius)", background: "#0F3E36", color: "#FFFFFF", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  01
                </div>
                <div>
                  <h3 style={{ fontSize: 16, margin: "0 0 4px", fontWeight: 600, color: "var(--ink)" }}>AI Clinical Triage &amp; Symptom Match</h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                    Enter your symptoms or lab markers. MediConnect AI identifies the right clinical specialty and urgency level.
                  </p>
                </div>
              </div>

              <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid rgba(15,62,54,0.1)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: "var(--radius)", background: "#0F3E36", color: "#FFFFFF", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  02
                </div>
                <div>
                  <h3 style={{ fontSize: 16, margin: "0 0 4px", fontWeight: 600, color: "var(--ink)" }}>Select your specialist &amp; slot</h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                    Filter verified physicians by expertise, fees, and open calendar timings. Complete conflict-free booking in under a minute.
                  </p>
                </div>
              </div>

              <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid rgba(15,62,54,0.1)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: "var(--radius)", background: "#0F3E36", color: "#FFFFFF", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  03
                </div>
                <div>
                  <h3 style={{ fontSize: 16, margin: "0 0 4px", fontWeight: 600, color: "var(--ink)" }}>Face-to-face video consultation</h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                    Connect directly with your doctor in a secure, private WebRTC consultation room right in your browser.
                  </p>
                </div>
              </div>

              <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid rgba(15,62,54,0.1)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, minWidth: 34, borderRadius: "var(--radius)", background: "#0F3E36", color: "#FFFFFF", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  04
                </div>
                <div>
                  <h3 style={{ fontSize: 16, margin: "0 0 4px", fontWeight: 600, color: "var(--ink)" }}>Digital prescriptions &amp; records</h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                    Receive structured e-prescriptions with dosage guidance directly after your call, accessible anytime in your health vault.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section style={{ padding: "64px 0", background: "var(--paper)" }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          <div
            style={{
              background: "#1b4332",
              borderRadius: "var(--radius-lg, 20px)",
              padding: "52px 36px",
              textAlign: "center",
              boxShadow: "0 20px 40px -15px rgba(27, 67, 50, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#FFFFFF",
            }}
          >
            <h2 style={{ fontSize: 32, marginBottom: 12, fontWeight: 600, color: "#FFFFFF" }}>
              Ready to speak with a verified physician?
            </h2>
            <p
              style={{
                color: "#d8f3dc",
                fontSize: 15.5,
                maxWidth: 540,
                margin: "0 auto 26px",
                lineHeight: 1.6,
              }}
            >
              Describe your symptoms, explore doctor availability, and complete your consultation today.
            </p>
            <Link
              to={user ? "/doctors" : "/login"}
              state={!user ? { from: { pathname: "/doctors" } } : undefined}
              style={{
                background: "#b7e4c7",
                color: "#1b4332",
                padding: "13px 30px",
                fontSize: 15,
                fontWeight: 600,
                borderRadius: "var(--radius)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
              }}
            >
              Browse Available Doctors →
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .how-it-works-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
