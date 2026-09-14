import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/doctors";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login({ email, password });
      toast.success("Logged in successfully.");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 200px)" }}>
      <div className="card card-pad card-elevated" style={{ maxWidth: 440, width: "100%", padding: "36px 32px" }}>
        <span className="eyebrow">Sign In</span>
        <h1 style={{ fontSize: 28, margin: "12px 0 24px" }}>Welcome back.</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <Link to="/forgot-password" className="link-quiet" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                Forgot password?
              </Link>
            </div>
          </div>
          <button className="btn btn-rust btn-block" type="submit" disabled={busy} style={{ marginTop: 20 }}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="faint" style={{ marginTop: 24, marginBottom: 0, textAlign: "center", fontSize: 14 }}>
          New here?{" "}
          <Link to="/signup" className="link-quiet" style={{ fontWeight: 600, color: "var(--pine)" }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
