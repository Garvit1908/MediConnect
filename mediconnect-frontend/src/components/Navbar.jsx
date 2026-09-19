import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    toast.info("Logged out.");
    navigate("/");
  };

  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background: "#FFFFFF",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 70,
          maxWidth: 1280,
          padding: "0 24px",
        }}
      >

        <NavLink
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <Mark />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 18.5,
              color: "#0F3E36",
              letterSpacing: "-0.01em",
            }}
          >
            MediConnect
          </span>
        </NavLink>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {user && user.role === "admin" && (
            <NavLink
              to="/admin"
              style={({ isActive }) => (isActive ? activeNavStyle : navStyle)}
              className="nav-link-item"
            >
              🛡️ Admin Portal
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/doctors"
              style={({ isActive }) => (isActive ? activeNavStyle : navStyle)}
              className="nav-link-item"
            >
              Find a Doctor
            </NavLink>
          )}

          {user && user.role !== "admin" && (
            <NavLink
              to="/appointments"
              style={({ isActive }) => (isActive ? activeNavStyle : navStyle)}
              className="nav-link-item"
            >
              Consultations &amp; Appointments
            </NavLink>
          )}

          {user && user.role !== "admin" && (
            <NavLink
              to="/prescriptions"
              style={({ isActive }) => (isActive ? activeNavStyle : navStyle)}
              className="nav-link-item"
            >
              Digital Prescriptions
            </NavLink>
          )}

          {user && user.role === "patient" && (
            <NavLink
              to="/records"
              style={({ isActive }) => (isActive ? activeNavStyle : navStyle)}
              className="nav-link-item"
            >
              Billing &amp; Records
            </NavLink>
          )}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {user ? (
            <>
              <NavLink
                to="/profile"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 9999,
                  background: "#F3F4F6",
                  color: "#1F2937",
                  fontSize: 13.5,
                  fontWeight: 500,
                  border: "1px solid #E5E7EB",
                  transition: "all 0.15s ease",
                }}
                className="user-profile-pill"
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#059669",
                  }}
                />
                <span>{user.username}</span>
                <span style={{ color: "#6B7280", fontSize: 12 }}>({user.role})</span>
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  height: 38,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  color: "#374151",
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                className="logout-nav-btn"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                style={{
                  ...navStyle,
                  height: 38,
                  padding: "0 16px",
                }}
              >
                Log in
              </NavLink>
              <NavLink
                to="/signup"
                className="btn btn-rust btn-sm"
                style={{ height: 38, padding: "0 18px", display: "inline-flex", alignItems: "center" }}
              >
                Create Account
              </NavLink>
            </>
          )}
        </div>
      </div>

      <style>{`
        .nav-link-item:hover {
          color: #0F3E36 !important;
          background-color: #F4F8F6 !important;
        }
        .nav-link-item:focus-visible {
          outline: 2px solid #0F3E36 !important;
          outline-offset: 2px !important;
        }
        .user-profile-pill:hover {
          background-color: #E5E7EB !important;
        }
        .logout-nav-btn:hover {
          background-color: #F9FAFB !important;
          border-color: #D1D5DB !important;
          color: #111827 !important;
        }
      `}</style>
    </header>
  );
}

const navStyle = {
  display: "inline-flex",
  alignItems: "center",
  height: 38,
  padding: "0 14px",
  borderRadius: "8px",
  fontSize: 14,
  fontWeight: 500,
  color: "#4B5563",
  textDecoration: "none",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  outline: "none",
};

const activeNavStyle = {
  display: "inline-flex",
  alignItems: "center",
  height: 38,
  padding: "0 14px",
  borderRadius: "8px",
  fontSize: 14,
  fontWeight: 600,
  color: "#0F3E36",
  backgroundColor: "#EAF2EF",
  textDecoration: "none",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  outline: "none",
};

function Mark() {
  return (
    <img
      src={logo}
      alt="MediConnect Logo"
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}
