import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function MediConnectAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am MediConnect AI, your clinical health assistant. How can I help you today?",
      suggestions: [
        "📋 Summarize a lab report / blood test",
        "🩺 I want to check my symptoms",
        "❓ What questions should I ask my doctor?"
      ]
    }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpenEvent = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSend(e.detail.prompt, e.detail?.context);
      }
    };
    window.addEventListener("open-mediconnect-ai", handleOpenEvent);
    return () => window.removeEventListener("open-mediconnect-ai", handleOpenEvent);
  }, []);

  const handleSend = async (textToSend, context = null) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = { id: Date.now().toString(), sender: "user", text: query };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await api.aiHealthChat(
        query,
        newHistory.map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
        context
      );

      if (res.success && res.data) {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: res.data.reply,
          summaryData: res.data.summaryData,
          triageData: res.data.triageData,
          suggestions: res.data.followUpSuggestions || []
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            text: "I apologize, I encountered a temporary issue processing your request. Please try again.",
            suggestions: ["I have a fever and sore throat", "Summarize fasting blood sugar 140 mg/dL"]
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "ai",
          text: "I could not connect to the clinical service. " + (err.message || "Please check your connection."),
          suggestions: ["Retry question"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{
              background: "linear-gradient(135deg, #0F3E36 0%, #16564B 100%)",
              color: "#FFFFFF",
              border: "1.5px solid rgba(255, 255, 255, 0.2)",
              padding: "12px 20px",
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 10px 25px -4px rgba(15, 62, 54, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 14px 30px -4px rgba(15, 62, 54, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px -4px rgba(15, 62, 54, 0.4)";
            }}
          >
            <span style={{ fontSize: 16 }}>✨</span>
            <span>MediConnect AI</span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 8px #10B981"
              }}
            />
          </button>
        )}
      </div>

      {/* Floating Chat Drawer / Card */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: "min(400px, calc(100vw - 32px))",
            height: "min(560px, calc(100vh - 48px))",
            zIndex: 10000,
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1.5px solid #CFE3DC",
            boxShadow: "0 20px 45px -10px rgba(15, 62, 54, 0.25), 0 8px 24px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "var(--font-body)"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0F3E36 0%, #16564B 100%)",
              color: "#FFFFFF",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16
                }}
              >
                ✨
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em" }}>MediConnect AI</div>
                <div style={{ fontSize: 11.5, color: "#A7F3D0", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                  Clinical Triage &amp; Report Analyst
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => setMessages([messages[0]])}
                title="Clear Chat"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#D1D5DB",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 4
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px",
              background: "#F9FAF9",
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.sender === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius: m.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: m.sender === "user" ? "#0F3E36" : "#FFFFFF",
                    color: m.sender === "user" ? "#FFFFFF" : "#111827",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    border: m.sender === "user" ? "none" : "1px solid #E5E7EB",
                    boxShadow: m.sender === "user" ? "0 2px 6px rgba(15, 62, 54, 0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
                    whiteSpace: "pre-line"
                  }}
                >
                  {m.text}

                  {m.triageData && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #E5E7EB" }}>
                      <Link
                        to="/doctors"
                        onClick={() => setIsOpen(false)}
                        className="btn btn-primary btn-sm btn-block"
                        style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none", textAlign: "center" }}
                      >
                        Book {m.triageData.primarySpecialization} Doctor →
                      </Link>
                    </div>
                  )}

                  {m.summaryData && m.summaryData.recommendedDoctor && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #E5E7EB" }}>
                      <Link
                        to="/doctors"
                        onClick={() => setIsOpen(false)}
                        className="btn btn-primary btn-sm btn-block"
                        style={{ fontSize: 12, padding: "6px 12px", textDecoration: "none", textAlign: "center" }}
                      >
                        Consult {m.summaryData.recommendedDoctor} →
                      </Link>
                    </div>
                  )}
                </div>

                {m.suggestions && m.suggestions.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(s)}
                        disabled={loading}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #CBD5E1",
                          color: "#0F3E36",
                          fontSize: 11.5,
                          padding: "4px 9px",
                          borderRadius: 9999,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#EAF2EF")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, color: "#6B7280", fontSize: 12.5, padding: "6px 10px" }}>
                <span className="spinner-border spinner-border-sm" role="status" />
                Analyzing clinical context...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: "10px 12px",
              background: "#FFFFFF",
              borderTop: "1px solid #E5E7EB",
              display: "flex",
              gap: 8,
              alignItems: "center"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask symptoms or paste lab report findings..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 8,
                border: "1.5px solid #D1D5DB",
                fontSize: 13,
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: "#0F3E36",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.6 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
