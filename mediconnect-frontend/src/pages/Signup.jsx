import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

const initialForm = { username: "", email: "", password: "", role: "patient" };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const defaultAvailability = [
  { day: "Mon", startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { day: "Tue", startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { day: "Wed", startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { day: "Thu", startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { day: "Fri", startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { day: "Sat", startTime: "10:00", endTime: "14:00", slotDuration: 30 },
];

export default function Signup() {
  const [step, setStep] = useState(1); // 1: Info -> 2: OTP -> 3: Complete Profile
  const [form, setForm] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Patient Profile Details
  const [patientData, setPatientData] = useState({
    age: "",
    gender: "",
    bloodGroup: "",
    address: "",
  });

  // Doctor Profile Details
  const [doctorData, setDoctorData] = useState({
    specialization: "",
    experience: "",
    qualification: "",
    consultationFee: "",
    availability: defaultAvailability,
  });

  const toast = useToast();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const updatePatient = (key) => (e) => setPatientData((p) => ({ ...p, [key]: e.target.value }));
  const updateDoctor = (key) => (e) => setDoctorData((d) => ({ ...d, [key]: e.target.value }));

  // Step 1: Request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await api.sendOtp(form.email);
      toast.success(`Verification code sent to ${form.email}`);
      setStep(2);
    } catch (err) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  // Step 2: Verify OTP & Authenticate
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.signup({ ...form, otp });
      await refreshSession(); // Refresh session to get authenticated user in context
      toast.success("Account verified! Please complete your profile to continue.");
      setStep(3); // Go to mandatory profile step
    } catch (err) {
      setError(err.message || "Verification failed. Please check the code.");
    } finally {
      setBusy(false);
    }
  };

  // Step 3: Complete Patient Profile
  const handlePatientProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.createPatientProfile({
        age: Number(patientData.age),
        gender: patientData.gender,
        bloodGroup: patientData.bloodGroup,
        address: patientData.address,
        medicalHistory: [],
      });
      await refreshSession();
      toast.success("Profile setup complete! Welcome to MediConnect.");
      navigate("/doctors");
    } catch (err) {
      setError(err.message || "Could not save patient profile.");
    } finally {
      setBusy(false);
    }
  };

  // Step 3: Complete Doctor Profile
  const handleDoctorProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.createDoctorProfile({
        specialization: doctorData.specialization,
        experience: Number(doctorData.experience),
        qualification: doctorData.qualification,
        consultationFee: Number(doctorData.consultationFee),
        availability: doctorData.availability,
      });
      await refreshSession();
      toast.success("Doctor profile created successfully! Welcome to MediConnect.");
      navigate("/appointments");
    } catch (err) {
      setError(err.message || "Could not save doctor profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className={step === 3 ? "single-col-auth" : "two-col-auth"}>
        <span className="eyebrow">
          {step === 3 ? "Mandatory Onboarding" : "Create Account"}
        </span>
        <h1 style={{ fontSize: 30, margin: "12px 0 8px" }}>
          {step === 1 && "Tell us who you are."}
          {step === 2 && "Check your inbox."}
          {step === 3 && (form.role === "doctor" ? "Complete Your Doctor Profile" : "Complete Your Patient Profile")}
        </h1>
        <p className="faint" style={{ marginBottom: 26 }}>
          {step === 1 && "Step 1 of 3 — credentials & role selection"}
          {step === 2 && `Step 2 of 3 — enter the 6-digit code sent to ${form.email}`}
          {step === 3 && "Step 3 of 3 — complete your essential profile details to get started."}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* STEP 1: Account Details */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="field">
              <label>I am a</label>
              <select value={form.role} onChange={update("role")}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div className="field">
              <label>Username</label>
              <input required value={form.username} onChange={update("username")} placeholder="jane_doe" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={update("password")} placeholder="At least 6 characters" />
            </div>
            <button className="btn btn-rust btn-block" type="submit" disabled={busy}>
              {busy ? "Sending Code…" : "Send Verification Code"}
            </button>

            <p className="faint" style={{ marginTop: 20, textAlign: "center" }}>
              Already have an account? <Link to="/login" className="link-quiet">Sign in</Link>
            </p>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerify}>
            <div className="field">
              <label>6-Digit Code</label>
              <input
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter OTP"
                maxLength={6}
                style={{
                  letterSpacing: otp ? "0.25em" : "normal",
                  fontFamily: "var(--font-mono)",
                  fontSize: 16,
                  textAlign: "center",
                }}
              />
              <div className="field-hint">
                Code expires in 5 minutes. If you requested multiple codes, enter the latest one received.
              </div>
            </div>
            <button className="btn btn-rust btn-block" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify & Continue to Profile"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 10 }}
              onClick={() => {
                setOtp("");
                setStep(1);
              }}
            >
              ← Edit details / resend code
            </button>
          </form>
        )}

        {/* STEP 3: Mandatory Patient Profile Form */}
        {step === 3 && form.role === "patient" && (
          <form onSubmit={handlePatientProfileSubmit} className="card card-pad">
            <div className="alert alert-info" style={{ marginBottom: 18 }}>
              💡 Profile photo can be uploaded anytime from your settings after registration.
            </div>

            <div className="field-row">
              <div className="field">
                <label>Age *</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  placeholder="e.g. 28"
                  value={patientData.age}
                  onChange={updatePatient("age")}
                />
              </div>

              <div className="field">
                <label>Gender *</label>
                <select required value={patientData.gender} onChange={updatePatient("gender")}>
                  <option value="">Select gender…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="field">
                <label>Blood Group *</label>
                <select required value={patientData.bloodGroup} onChange={updatePatient("bloodGroup")}>
                  <option value="">Select blood group…</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Residential Address *</label>
              <textarea
                required
                rows={2}
                placeholder="Street address, city, state, postal code"
                value={patientData.address}
                onChange={updatePatient("address")}
              />
            </div>

            <button className="btn btn-rust btn-block" type="submit" disabled={busy}>
              {busy ? "Saving Profile…" : "Complete Setup & Explore Doctors"}
            </button>
          </form>
        )}

        {/* STEP 3: Mandatory Doctor Profile Form */}
        {step === 3 && form.role === "doctor" && (
          <form onSubmit={handleDoctorProfileSubmit} className="card card-pad">
            <div className="alert alert-info" style={{ marginBottom: 18 }}>
              💡 Profile photo and medical license verification documents can be uploaded later from your account settings.
            </div>

            <div className="field-row">
              <div className="field">
                <label>Specialization *</label>
                <input
                  list="specialties-list"
                  required
                  placeholder="e.g. Cardiologist"
                  value={doctorData.specialization}
                  onChange={updateDoctor("specialization")}
                />
                <datalist id="specialties-list">
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

              <div className="field">
                <label>Experience (Years) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 8"
                  value={doctorData.experience}
                  onChange={updateDoctor("experience")}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Highest Qualification *</label>
                <input
                  required
                  placeholder="e.g. MBBS, MD (Medicine)"
                  value={doctorData.qualification}
                  onChange={updateDoctor("qualification")}
                />
              </div>

              <div className="field">
                <label>Consultation Fee (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  placeholder="e.g. 700"
                  value={doctorData.consultationFee}
                  onChange={updateDoctor("consultationFee")}
                />
              </div>
            </div>

            <div className="field">
              <label>Standard Consultation Hours</label>
              <p className="faint" style={{ fontSize: "0.85rem", margin: "4px 0 10px" }}>
                Pre-configured for Monday – Saturday (09:00 AM – 05:00 PM). You can customize weekly slots anytime in profile settings.
              </p>
            </div>

            <button className="btn btn-rust btn-block" type="submit" disabled={busy}>
              {busy ? "Saving Profile…" : "Complete Doctor Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
