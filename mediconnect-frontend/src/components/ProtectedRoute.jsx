import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Loader from "./Loader";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking session" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container page">
        <div className="alert alert-error">
          Access denied. This page requires: {roles.join(" or ")}.
        </div>
      </div>
    );
  }

  return children;
}
