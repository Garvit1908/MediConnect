import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #092019 0%, #04100c 100%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#e2e8f0",
        padding: "54px 0 28px",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 36,
          fontSize: 14,
          marginBottom: 40,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 18,
              color: "#FFFFFF",
              marginBottom: 12,
            }}
          >
            <img
              src={logo}
              alt="MediConnect Logo"
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}
            />
            MediConnect
          </div>
          <div
            style={{
              color: "#9bb0a7",
              lineHeight: 1.65,
              maxWidth: 290,
              fontSize: 13,
            }}
          >
            Trusted telemedicine and clinical management. Verified doctors, secure consultations, and digital health records.
          </div>
        </div>

        <div className="footer-col" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#52b788",
            }}
          >
            Platform
          </span>
          <Link to="/doctors" className="footer-link">Find a Doctor</Link>
          <Link to="/signup" className="footer-link">Create Account</Link>
          <Link to="/login" className="footer-link">Doctor Login</Link>
        </div>

        <div className="footer-col" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#52b788",
            }}
          >
            Features
          </span>
          <span style={{ color: "#a5b9b1", fontSize: 13.5 }}>Online Video Consultation</span>
          <span style={{ color: "#a5b9b1", fontSize: 13.5 }}>Digital Prescriptions</span>
          <span style={{ color: "#a5b9b1", fontSize: 13.5 }}>Verified Medical Records</span>
        </div>

        <div className="footer-col" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#52b788",
            }}
          >
            Trust & Security
          </span>
          <span style={{ color: "#a5b9b1", fontSize: 13.5 }}>Verified Healthcare Experts</span>
          <span style={{ color: "#a5b9b1", fontSize: 13.5 }}>Razorpay Secure Payments</span>
          <span style={{ color: "#a5b9b1", fontSize: 13.5 }}>Strict Patient Confidentiality</span>
        </div>
      </div>

      <div
        className="container"
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: 22,
          fontSize: 13,
          color: "#72887f",
        }}
      >
        <div>© {currentYear} MediConnect Telehealth. All rights reserved.</div>
      </div>

      <style>{`
        .footer-link {
          color: #c0d1ca;
          text-decoration: none;
          font-size: 13.5px;
          transition: color 0.15s ease, transform 0.15s ease;
          display: inline-block;
        }
        .footer-link:hover {
          color: #ffffff;
          transform: translateX(2px);
        }
        @media (max-width: 820px) {
          footer .container:first-child {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
        }
        @media (max-width: 480px) {
          footer .container:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
