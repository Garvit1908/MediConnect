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

  // AI Symptom Matcher states
  const [symptomsInput, setSymptomsInput] = useState("");
  const [matchingAi, setMatchingAi] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    setTriageResult(null); // Clear AI badge when using manual filters
    fetchDoctors(filters);
  };

  // AI Symptom Search Handler
  const handleAiMatch = async (e) => {
    e.preventDefault();
    if (!symptomsInput.trim()) {
      toast.error("Please describe your symptoms first.");
      return;
    }

    setMatchingAi(true);
    try {
      const res = await api.matchDoctorBySymptoms(symptomsInput.trim());
      setTriageResult(res.triage);
      setDoctors(res.data || []);
      toast.success(`Matched with ${res.triage.specialization}`);
    } catch (err) {
      toast.error(err.message || "Failed to analyze symptoms.");
    } finally {
      setMatchingAi(false);
    }
  };

  // Clear AI triage and restore all doctors
  const handleResetAi = () => {
    setTriageResult(null);
    setSymptomsInput("");
    fetchDoctors();
  };

  // Urgency badge helper
  const getUrgencyBadgeClass = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "urgent":
      case "emergency":
        return "badge-red";
      case "moderate":
        return "badge-amber";
      default:
        return "badge-teal";
    }
  };

  return (
    <div className="container page">
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <span className="eyebrow">Directory</span>
          <h1 style={{ fontSize: 30, margin: "10px 0 0" }}>Find a Doctor</h1>
          <p style={{ color: "var(--ink-soft)", margin: "6px 0 0", fontSize: 14 }}>
            Describe your symptoms to let AI recommend the right specialist, or use manual filters.
          </p>
        </div>
      </div>

      {/* 🌟 AI Symptom Matcher Card */}
      <div
        className="card card-pad"
        style={{
          marginBottom: 20,
          background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)",
          borderColor: "rgba(15, 62, 54, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <h3 style={{ fontSize: 16, margin: 0, color: "var(--pine)" }}>
            AI Specialist Recommendation
          </h3>
          <span className="badge badge-rust" style={{ fontSize: 11 }}>Gemini Powered</span>
        </div>

        <form onSubmit={handleAiMatch} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            className="input"
            style={{ flex: "1 1 300px", padding: "10px 14px", borderRadius: "var(--radius)" }}
            placeholder="e.g., severe migraine with light sensitivity for 2 days, chest discomfort..."
            value={symptomsInput}
            onChange={(e) => setSymptomsInput(e.target.value)}
            disabled={matchingAi}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={matchingAi || !symptomsInput.trim()}
            style={{ minWidth: 140 }}
          >
            {matchingAi ? "Analyzing..." : "Find Specialist"}
          </button>
          {triageResult && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleResetAi}
              title="Clear AI recommendations"
            >
              Reset AI
            </button>
          )}
        </form>

        {/* 🩺 AI Triage Result Display */}
        {triageResult && (
          <div
            style={{
              marginTop: 16,
              padding: "14px 18px",
              background: "#FFFFFF",
              borderRadius: "var(--radius)",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                  Recommended Specialist:
                </span>
                <span className="badge badge-rust" style={{ fontSize: 13, fontWeight: 600 }}>
                  {triageResult.specialization}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Urgency:</span>
                <span className={`badge ${getUrgencyBadgeClass(triageResult.urgency)}`}>
                  {triageResult.urgency?.toUpperCase()}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ink)" }}>Clinical Reasoning: </strong>
              {triageResult.reasoning}
            </p>
          </div>
        )}
      </div>

      {/* 🔍 Standard Manual Filters */}
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
              Filter
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
          {triageResult ? `Matching ${triageResult.specialization}s` : "Available Doctors"}{" "}
          <span style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 400 }}>
            ({doctors.length})
          </span>
        </h2>
      </div>

      {loading ? (
        <Loader label="Fetching doctors" />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors match those criteria"
          hint="Try searching different symptoms or widening your filters."
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
