import { useEffect, useState } from "react";
import { api } from "../lib/api";
import DoctorCard from "../components/DoctorCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { useToast } from "../lib/toast";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ specialization: "", maxFee: "", minExp: "" });
  const toast = useToast();

  const fetchDoctors = async (f = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.specialization) params.set("specialization", f.specialization);
      if (f.maxFee) params.set("maxFee", f.maxFee);
      if (f.minExp) params.set("minExp", f.minExp);
      const res = await api.getDoctors(params.toString());
      setDoctors(res.data || []);
    } catch (err) {
      toast.error(err.message || "Could not load doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();

  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchDoctors(filters);
  };

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Directory</span>
          <h1 style={{ fontSize: 30, margin: "10px 0 0" }}>Find a Doctor</h1>
        </div>
      </div>

      <form onSubmit={handleFilter} className="card card-pad" style={{ marginBottom: 28 }}>
        <div className="field-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Specialization</label>
            <input
              list="specialization-options"
              placeholder="All Specializations"
              value={filters.specialization}
              onChange={(e) => setFilters((f) => ({ ...f, specialization: e.target.value }))}
            />
            <datalist id="specialization-options">
              <option value="General Physician" />
              <option value="Cardiologist" />
              <option value="Dermatologist" />
              <option value="Neurologist" />
              <option value="Orthopedic" />
              <option value="Pediatrician" />
              <option value="Psychiatrist" />
              <option value="Dentist" />
              <option value="ENT Specialist" />
            </datalist>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Max Fee (₹)</label>
            <input
              type="number"
              min="0"
              placeholder="Any Max Fee"
              value={filters.maxFee}
              onChange={(e) => setFilters((f) => ({ ...f, maxFee: e.target.value }))}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Min Experience (yrs)</label>
            <input
              type="number"
              min="0"
              placeholder="Any Experience"
              value={filters.minExp}
              onChange={(e) => setFilters((f) => ({ ...f, minExp: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button className="btn btn-primary btn-block" type="submit">
              Search
            </button>
            {(filters.specialization || filters.maxFee || filters.minExp) && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  const empty = { specialization: "", maxFee: "", minExp: "" };
                  setFilters(empty);
                  fetchDoctors(empty);
                }}
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {loading ? (
        <Loader label="Fetching doctors" />
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors match those filters" hint="Try widening your search." />
      ) : (
        <div className="grid-3">
          {doctors.map((d) => (
            <DoctorCard key={d._id} doctor={d} />
          ))}
        </div>
      )}
    </div>
  );
}
