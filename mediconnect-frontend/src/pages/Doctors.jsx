import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";
import DoctorCard from "../components/DoctorCard";
import AISymptomMatcher from "../components/AISymptomMatcher";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { useToast } from "../lib/toast";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symptomQuery, setSymptomQuery] = useState("");
  const [filters, setFilters] = useState({ specialization: "", maxFee: "", minExp: "" });
  const [activeTriage, setActiveTriage] = useState(null);
  const [isAiFiltered, setIsAiFiltered] = useState(false);
  const toast = useToast();
  const location = useLocation();

  const fetchDoctors = async (f = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.specialization) params.set("specialization", f.specialization);
      if (f.maxFee) params.set("maxFee", f.maxFee);
      if (f.minExp) params.set("minExp", f.minExp);
      const res = await api.getDoctors(params.toString());
      setDoctors(res.data || []);
      setIsAiFiltered(false);
      setActiveTriage(null);
    } catch (err) {
      toast.error(err.message || "Could not load doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const symptomsFromUrl = params.get("symptoms");
    if (symptomsFromUrl) {
      setSymptomQuery(symptomsFromUrl);
      handleSymptomSearch(symptomsFromUrl);
    } else {
      fetchDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleFilter = (e) => {
    e.preventDefault();
    if (symptomQuery.trim()) {
      handleSymptomSearch(symptomQuery);
    } else {
      fetchDoctors(filters);
    }
  };

  const handleSymptomSearch = async (text) => {
    const q = (text || symptomQuery).trim();
    if (!q) {
      fetchDoctors(filters);
      return;
    }
    setLoading(true);
    try {
      const res = await api.matchDoctorBySymptoms(q);
      if (res.success) {
        setDoctors(res.data || []);
        setActiveTriage(res.triage);
        setIsAiFiltered(true);
        toast.success("Found " + (res.data?.length || 0) + " doctors matching your symptoms!");
      }
    } catch (err) {
      toast.error(err.message || "Could not match symptoms.");
      fetchDoctors(filters);
    } finally {
      setLoading(false);
    }
  };

  const handleAiMatchResults = (matchedDoctors, triage) => {
    setDoctors(matchedDoctors || []);
    setActiveTriage(triage);
    setIsAiFiltered(true);
  };

  const handleClearAiResults = () => {
    setSymptomQuery("");
    setActiveTriage(null);
    setIsAiFiltered(false);
    fetchDoctors(filters);
  };

  return (
    <div className="container page">
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <span className="eyebrow">Directory</span>
          <h1 style={{ fontSize: 30, margin: "10px 0 0" }}>Find a Doctor</h1>
        </div>
      </div>

      {/* AI Symptom Matcher Assistant */}
      <AISymptomMatcher
        onMatchResults={handleAiMatchResults}
        onClearResults={handleClearAiResults}
        activeTriage={activeTriage}
        isSearchingAll={!isAiFiltered}
      />

      {/* Integrated Search & Filter Form */}
      <form onSubmit={handleFilter} className="card card-pad" style={{ marginBottom: 28 }}>
        {/* Full-width symptom search bar */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6, display: "block" }}>
            Search by Symptoms
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={symptomQuery}
              onChange={(e) => setSymptomQuery(e.target.value)}
              placeholder="Enter your symptoms to find consultant (e.g., chest tightness, skin rash, persistent migraine)..."
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                fontSize: 14,
                fontFamily: "var(--font-body)"
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSymptomSearch(symptomQuery)}
              style={{ whiteSpace: "nowrap", padding: "10px 20px" }}
            >
              Find Consultant ✨
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--line)", margin: "16px 0" }} />

        {/* Standard Criteria Row */}
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
              Filter
            </button>
            {(filters.specialization || filters.maxFee || filters.minExp || isAiFiltered || symptomQuery) && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSymptomQuery("");
                  const empty = { specialization: "", maxFee: "", minExp: "" };
                  setFilters(empty);
                  setActiveTriage(null);
                  setIsAiFiltered(false);
                  fetchDoctors(empty);
                }}
                title="Reset All Filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Doctor Listings Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: 0, color: "var(--ink)" }}>
          {isAiFiltered && activeTriage ? (
            <>
              Recommended {activeTriage.primarySpecialization} Specialists{" "}
              <span style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 400 }}>
                ({doctors.length} available)
              </span>
            </>
          ) : (
            <>
              Available Doctors{" "}
              <span style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 400 }}>
                ({doctors.length})
              </span>
            </>
          )}
        </h2>
      </div>

      {loading ? (
        <Loader label="Fetching doctors" />
      ) : doctors.length === 0 ? (
        <EmptyState
          title={isAiFiltered ? "No doctors found for this symptom profile" : "No doctors match those filters"}
          hint={isAiFiltered ? "Try widening your symptom keywords or consult a General Physician." : "Try widening your search."}
        />
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
