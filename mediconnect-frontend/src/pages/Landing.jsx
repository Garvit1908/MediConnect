import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import telehealthShowcase from "../assets/telehealth-showcase.jpg";
import consultationPhoto from "../assets/telehealth-consultation.jpg";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ background: "var(--paper)" }}>
      {/* ---------- HERO ---------- */}
      <section className="container" style={{ maxWidth: 1320, paddingTop: 56, paddingBottom: 56 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.28fr",
            gap: 48,
            alignItems: "center",
          }}
          className="hero-grid"
        >
          {/* Hero Left Content */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 22 }}>
              <span className="eyebrow-dot" />
              Direct Access Telehealth Network
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
                fontSize: 17,
                color: "var(--ink-soft)",
                maxWidth: 490,
                lineHeight: 1.65,
                margin: "0 0 32px",
              }}
            >
              Consult board-certified doctors across leading clinical specialties from the comfort of home.
              Get digital prescriptions, view health records, and stay connected with your care team.
            </p>

            <div className="row" style={{ gap: 14 }}>
              <Link
                to={user ? "/doctors" : "/login"}
                state={!user ? { from: { pathname: "/doctors" } } : undefined}
                className="btn btn-primary"
                style={{ padding: "12px 26px", fontSize: 14.5 }}
              >
                Find a specialist →
              </Link>
              <Link
                to={user ? "/appointments" : "/login"}
                state={!user ? { from: { pathname: "/appointments" } } : undefined}
                className="btn btn-outline"
                style={{ padding: "12px 24px", fontSize: 14.5 }}
              >
                View Appointments
              </Link>
            </div>
          </div>

          {/* Hero Right Visual (Video Consultation Showcase) */}
          <div style={{ position: "relative" }}>
            {/* Showcase Image Frame */}
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

        {/* ---------- STATS & TRUST ROW ---------- */}
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
          {/* Numbers */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>
                1-on-1
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Direct peer consultations</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>
                100%
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>End-to-end encrypted</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink)" }}>
                Instant
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Digital prescriptions</div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              <span>🩺</span> Trusted Medical Care
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              <span>🔒</span> Private Encrypted Consultation
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-soft)" }}>
              <span>📋</span> Digital Prescriptions
            </div>
          </div>
        </div>
      </section>



      {/* ---------- HOW MEDICONNECT WORKS (CARE DELIVERY MODEL) ---------- */}
      <section
        style={{
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          background: "#F4F8F6",
          padding: "84px 0",
        }}
      >
        <div className="container">
          {/* Header (Option 3: Quality Healthcare Made Simple) */}
          <div style={{ maxWidth: 700, marginBottom: 52 }}>
            <span
              style={{
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--rust)",
                fontWeight: 600,
                display: "block",
                marginBottom: 10,
              }}
            >
              Telehealth Workflow
            </span>
            <h2 style={{ fontSize: 34, margin: "0 0 14px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>
              Quality healthcare made simple, transparent, and fast
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: 16, margin: 0, lineHeight: 1.6 }}>
              Choose your physician, pick a convenient time slot, and consult securely from any device with immediate post-visit prescriptions.
            </p>
          </div>

          {/* 2-Column Split: Image on Left + 3 Step Cards on Right */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 52,
              alignItems: "center",
            }}
            className="how-it-works-grid"
          >
            {/* Left Column: Enlarged Real Consultation Photo (Badge removed) */}
            <div>
              <div
                style={{
                  borderRadius: "var(--radius-lg, 20px)",
                  overflow: "hidden",
                  boxShadow: "0 24px 48px -12px rgba(15, 62, 54, 0.16)",
                  border: "1px solid rgba(15, 62, 54, 0.12)",
                  background: "#FFFFFF",
                }}
              >
                <img
                  src={consultationPhoto}
                  alt="Doctor conducting live video consultation"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 480,
                    maxHeight: 560,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </div>

            {/* Right Column: 3 Sleek White Step Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Step 1 */}
              <div
                className="card card-pad"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15, 62, 54, 0.1)",
                  boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
                  padding: "24px 26px",
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    borderRadius: "var(--radius)",
                    background: "#0F3E36",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  01
                </div>
                <div>
                  <h3 style={{ fontSize: 17, margin: "0 0 6px", fontWeight: 600, color: "var(--ink)" }}>
                    Select your specialist &amp; slot
                  </h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>
                    Filter certified physicians by clinical expertise, fees, and open calendar timings. Complete your reservation in under a minute.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="card card-pad"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15, 62, 54, 0.1)",
                  boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
                  padding: "24px 26px",
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    borderRadius: "var(--radius)",
                    background: "#0F3E36",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  02
                </div>
                <div>
                  <h3 style={{ fontSize: 17, margin: "0 0 6px", fontWeight: 600, color: "var(--ink)" }}>
                    Face-to-face video consultation
                  </h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>
                    Connect directly with your doctor in a secure, private video consultation room right in your browser with zero downloads.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="card card-pad"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(15, 62, 54, 0.1)",
                  boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
                  padding: "24px 26px",
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    borderRadius: "var(--radius)",
                    background: "#0F3E36",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  03
                </div>
                <div>
                  <h3 style={{ fontSize: 17, margin: "0 0 6px", fontWeight: 600, color: "var(--ink)" }}>
                    Digital prescriptions &amp; records
                  </h3>
                  <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>
                    Receive structured e-prescriptions with dosage guidance directly after your call, accessible forever in your secure dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- WHY CHOOSE MEDICONNECT ---------- */}
      <section className="container" style={{ padding: "72px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 48px" }}>
          <span className="eyebrow" style={{ marginBottom: 12 }}>Comprehensive Care</span>
          <h2 style={{ fontSize: 32, margin: "0 0 10px", fontWeight: 500 }}>Why Patients Choose MediConnect</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
            Built to provide reliable medical care without friction or long hospital lines.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 24 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 24, marginBottom: 12 }}>🩺</div>
            <h3 style={{ fontSize: 18, marginBottom: 6, fontWeight: 600 }}>Verified Medical Specialists</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: 14.5, margin: 0 }}>
              Browse certified doctors across clinical specialties with transparent fees, experience details, and patient ratings.
            </p>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 24, marginBottom: 12 }}>⏱️</div>
            <h3 style={{ fontSize: 18, marginBottom: 6, fontWeight: 600 }}>Instant Slot Scheduling</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: 14.5, margin: 0 }}>
              View real-time availability calendars and lock in confirmed consultation slots with zero booking overlap.
            </p>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 24, marginBottom: 12 }}>📹</div>
            <h3 style={{ fontSize: 18, marginBottom: 6, fontWeight: 600 }}>Peer-to-Peer Video Care</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: 14.5, margin: 0 }}>
              Join secure, low-latency video consultations directly in your browser with no app installations required.
            </p>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 24, marginBottom: 12 }}>📁</div>
            <h3 style={{ fontSize: 18, marginBottom: 6, fontWeight: 600 }}>Centralized Health Records</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: 14.5, margin: 0 }}>
              Access clinical prescriptions, diagnostic reports, and visit summaries securely stored in your personal dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- BOTTOM ELEVATED CTA CARD WITH DARK GREEN BG ---------- */}
      <section style={{ padding: "72px 0", background: "var(--paper)" }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          <div
            style={{
              background: "#1b4332",
              borderRadius: "var(--radius-lg, 20px)",
              padding: "56px 40px",
              textAlign: "center",
              boxShadow: "0 20px 40px -15px rgba(27, 67, 50, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#FFFFFF",
            }}
          >
            <h2 style={{ fontSize: 34, marginBottom: 12, fontWeight: 600, color: "#FFFFFF" }}>
              Ready to speak with a physician?
            </h2>
            <p
              style={{
                color: "#d8f3dc",
                fontSize: 16,
                maxWidth: 540,
                margin: "0 auto 28px",
                lineHeight: 1.6,
              }}
            >
              Find a doctor by specialty, view open slots, and complete your consultation today.
            </p>
            <Link
              to={user ? "/doctors" : "/login"}
              state={!user ? { from: { pathname: "/doctors" } } : undefined}
              style={{
                background: "#b7e4c7",
                color: "#1b4332",
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 600,
                borderRadius: "var(--radius)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                transition: "transform 0.15s, opacity 0.2s",
              }}
            >
              Browse Available Doctors
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
