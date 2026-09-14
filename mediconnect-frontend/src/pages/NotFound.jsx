import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container page" style={{ textAlign: "center" }}>
      <span className="eyebrow">404</span>
      <h1 style={{ fontSize: 32, margin: "14px 0" }}>Page not found in the ledger.</h1>
      <Link to="/" className="btn btn-rust">Back to Home</Link>
    </div>
  );
}
