import { useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

const SAMPLE_SYMPTOMS = [
  { label: "High Fever & Chills", text: "High fever for 2 days with body ache, chills and severe fatigue" },
  { label: "Chest Tightness", text: "Chest pressure, shortness of breath, and palpitations" },
  { label: "Skin Rash & Itching", text: "Red itchy skin rash with small bumps spreading on arms and neck" },
  { label: "Severe Migraine", text: "Throbbing one-sided headache with extreme sensitivity to light and nausea" },
  { label: "Joint & Knee Pain", text: "Persistent knee joint pain, swelling, and morning stiffness when walking" },
  { label: "Sore Throat & Earache", text: "Sharp throat pain when swallowing with ear congestion and hoarseness" }
];

export default function AISymptomMatcher({ onMatchResults, onClearResults, activeTriage, isSearchingAll }) {
  const [symptomInput, setSymptomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAnalyze = async (textToAnalyze) => {
    const query = (textToAnalyze || symptomInput).trim();
    if (!query) {
      toast.error("Please describe your symptoms first.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.matchDoctorBySymptoms(query);
      if (res.success) {
        onMatchResults(res.data || [], res.triage);
        toast.success("AI matched you with " + (res.triage?.primarySpecialization || "Specialists") + "!");
      } else {
        toast.error(res.message || "Could not analyze symptoms.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to analyze symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (text) => {
    setSymptomInput(text);
    handleAnalyze(text);
  };

  const handleReset = () => {
    setSymptomInput("");
    onClearResults();
  };

  return (
    <div
      className="card card-pad"
      style={{
        marginBottom: 28,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F6FAF8 100%)",
        border: "1.5px solid #CFE3DC",
        boxShadow: "0 4px 20px -2px rgba(15, 62, 54, 0.06)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--pine)",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "9999px",
              letterSpacing: "0.02em"
            }}
          >
            <span>✨</span> AI Clinical Triage
          </span>
          <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>
            Smart Specialist Recommendation
          </span>
        </div>

        {activeTriage && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleReset}
            style={{ fontSize: 12.5, padding: "4px 10px" }}
          >
            ✕ Clear AI Match & View All
          </button>
        )}
      </div>

      <h2 style={{ fontSize: 20, margin: "0 0 6px", fontWeight: 600, color: "var(--pine-dark)" }}>
        Not sure which doctor to consult?
      </h2>
      <p style={{ margin: "0 0 16px", color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, maxWidth: 640 }}>
        Describe what you are experiencing in plain language. MediConnect AI evaluates clinical indicators, checks urgency, and filters verified specialists for your exact condition.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAnalyze();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <div style={{ position: "relative" }}>
          <textarea
            rows={2}
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            placeholder="e.g., I have had a high fever for 2 days with severe throat pain, fatigue and difficulty swallowing..."
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1.5px solid #CBD5E1",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              resize: "vertical",
              minHeight: 64,
              background: "#FFFFFF",
              color: "var(--ink)",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 500 }}>Try asking:</span>
          {SAMPLE_SYMPTOMS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip.text)}
              disabled={loading}
              style={{
                fontSize: 12,
                padding: "3px 9px",
                background: "#FFFFFF",
                border: "1px solid #D1D5DB",
                borderRadius: 9999,
                color: "var(--ink-soft)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !symptomInput.trim()}
            style={{
              padding: "10px 22px",
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: loading || !symptomInput.trim() ? 0.7 : 1
            }}
          >
            {loading ? "Analyzing Clinical Symptoms..." : "✨ Find Matching Specialist"}
          </button>
        </div>
      </form>

      {activeTriage && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 10,
            background: "#FFFFFF",
            border: "1px solid #CFE3DC",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>Recommended Specialization:</span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--pine)",
                  background: "var(--pine-tint)",
                  padding: "4px 12px",
                  borderRadius: 6
                }}
              >
                👨‍⚕️ {activeTriage.primarySpecialization}
              </span>

              {activeTriage.confidence && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "#ECFDF5",
                    color: "#065F46",
                    border: "1px solid #A7F3D0"
                  }}
                >
                  {activeTriage.confidence}% Match
                </span>
              )}

              {activeTriage.secondarySpecialization && (
                <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                  (Alt: {activeTriage.secondarySpecialization})
                </span>
              )}
            </div>

            <div>
              {activeTriage.urgency === "High" ? (
                <span
                  style={{
                    background: "#FEE2E2",
                    color: "#991B1B",
                    border: "1px solid #FCA5A5",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 9999
                  }}
                >
                  ⚠️ High Urgency - Prompt Evaluation Recommended
                </span>
              ) : activeTriage.urgency === "Moderate" ? (
                <span
                  style={{
                    background: "#FEF3C7",
                    color: "#92400E",
                    border: "1px solid #FDE68A",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 9999
                  }}
                >
                  ⏱️ Moderate Urgency - Schedule Within 24-48 hrs
                </span>
              ) : (
                <span
                  style={{
                    background: "#ECFDF5",
                    color: "#047857",
                    border: "1px solid #A7F3D0",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 9999
                  }}
                >
                  🩺 Routine Consultation Recommended
                </span>
              )}
            </div>
          </div>

          {activeTriage.clinicalSummary && (
            <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, margin: "0 0 12px" }}>
              <strong>Clinical Assessment:</strong> {activeTriage.clinicalSummary}
            </p>
          )}

          {activeTriage.matchedKeywords && activeTriage.matchedKeywords.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>Detected Indicators:</span>
              {activeTriage.matchedKeywords.map((kw, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11.5,
                    background: "#F3F4F6",
                    color: "var(--ink-soft)",
                    padding: "2px 8px",
                    borderRadius: 4
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {activeTriage.recommendedQuestions && activeTriage.recommendedQuestions.length > 0 && (
            <div
              style={{
                background: "var(--paper-soft)",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 10
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pine)", marginBottom: 4 }}>
                Suggested questions for your consultation:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                {activeTriage.recommendedQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--ink-faint)", fontStyle: "italic", borderTop: "1px solid #F3F4F6", paddingTop: 8 }}>
            Disclaimer: {activeTriage.disclaimer || "MediConnect AI is an assistive triage tool and does not provide formal medical diagnosis."}
          </div>
        </div>
      )}
    </div>
  );
}
