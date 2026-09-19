import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    try {
      await api.forgotPasswordOtp(email);
      toast.success(`Password reset code sent to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.message || "Could not send reset code.");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api.resetPassword({
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      toast.success("Password reset successfully! You can now sign in.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to reset password. Please verify the code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 200px)" }}>
      <div className="card card-pad card-elevated" style={{ maxWidth: 440, width: "100%", padding: "36px 32px" }}>
        <span className="eyebrow">Recovery</span>

        {step === 1 ? (
          <>
            <h1 style={{ fontSize: 30, margin: "12px 0 10px" }}>Forgot Password</h1>
            <p className="faint" style={{ marginBottom: 24 }}>
              Enter your registered email address to receive a 6-digit verification code.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSendOtp}>
              <div className="field">
                <label>Registered Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <button className="btn btn-rust btn-block" type="submit" disabled={busy}>
                {busy ? "Sending Code…" : "Send Reset Code"}
              </button>
            </form>

            <p className="faint" style={{ marginTop: 20, textAlign: "center" }}>
              Remember your password?{" "}
              <Link to="/login" className="link-quiet">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 30, margin: "12px 0 10px" }}>Set New Password</h1>
            <p className="faint" style={{ marginBottom: 24 }}>
              Enter the 6-digit code sent to <strong style={{ color: "var(--ink)" }}>{email}</strong> and choose your new password.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="field">
                <label>6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="e.g. 123456"
                  style={{ letterSpacing: 4, fontWeight: 600 }}
                />
              </div>

              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>

              <button className="btn btn-rust btn-block" type="submit" disabled={busy}>
                {busy ? "Resetting Password…" : "Reset Password"}
              </button>
            </form>

            <div className="spread" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn-link link-quiet"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
              >
                ← Change Email
              </button>
              <button
                type="button"
                className="btn-link link-quiet"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                disabled={busy}
                onClick={handleSendOtp}
              >
                Resend Code
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
