import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import AppointmentCard from "../components/AppointmentCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

export default function Appointments() {
  const { user } = useAuth();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getMyAppointments();
        setAppointments(res.data || []);
      } catch (err) {
        toast.error(err.message || "Could not load appointments.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Ledger</span>
          <h1 style={{ fontSize: 30, margin: "10px 0 0" }}>My Appointments</h1>
        </div>
        {user?.role === "patient" && (
          <Link to="/doctors" className="btn btn-outline btn-sm">
            Book Another
          </Link>
        )}
      </div>

      {loading ? (
        <Loader label="Fetching appointments" />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          hint={user?.role === "patient" ? "Book a doctor to get started." : "Nothing booked with you yet."}
          action={
            user?.role === "patient" ? (
              <Link to="/doctors" className="btn btn-rust btn-sm">
                Find a Doctor
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid-3">
          {appointments.map((a) => (
            <AppointmentCard key={a._id} appointment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
