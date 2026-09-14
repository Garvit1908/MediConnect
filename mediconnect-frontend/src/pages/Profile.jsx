import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import Loader from "../components/Loader";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Profile() {
  const { user, refreshSession } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file is too large. Maximum allowed size is 15MB.");
      return;
    }
    setUploading(true);
    try {
      await api.updateProfilePicture(file);
      await refreshSession();
      toast.success("Profile picture updated.");
    } catch (err) {
      toast.error(err.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Account</span>
          <h1 style={{ fontSize: 30, margin: "10px 0 0" }}>Your Profile</h1>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div className="row" style={{ gap: 20 }}>
          <Avatar url={user.profilePicUrl} name={user.username} />
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 2 }}>{user.username}</h3>
            <p className="faint" style={{ marginBottom: 2 }}>{user.email}</p>
            <span className="badge badge-rust">{user.role}</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "Change Photo"}
            </button>
          </div>
        </div>
      </div>

      {user.role === "patient" && <PatientProfileForm />}
      {user.role === "doctor" && <DoctorProfileForm />}
    </div>
  );
}

function Avatar({ url, name }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--line)" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "var(--rust-tint)",
        color: "var(--rust-dark)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontSize: 24,
        fontWeight: 700,
      }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Patient profile                                                     */
/* ------------------------------------------------------------------ */

function PatientProfileForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  const [form, setForm] = useState({ age: "", gender: "", bloodGroup: "", address: "" });
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      const res = await api.getMyPatientProfile();
      const d = res.data;
      const initialForm = {
        age: d.age ?? "",
        gender: d.gender ?? "",
        bloodGroup: d.bloodGroup ?? "",
        address: d.address ?? "",
      };
      const initialHistory = (d.medicalHistory || []).map((h) => ({
        condition: h.condition || "",
        diagnosedOn: h.diagnosedOn ? h.diagnosedOn.slice(0, 10) : "",
        notes: h.notes || "",
      }));

      setForm(initialForm);
      setHistory(initialHistory);
      setOriginalData({ form: initialForm, history: initialHistory });
      setExists(true);
      setIsEditing(false);
    } catch (err) {
      if (err.status === 404) {
        setExists(false);
        setIsEditing(true); // Open in edit mode if no profile exists
      } else {
        toast.error(err.message || "Could not load your profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelEdit = () => {
    if (originalData) {
      setForm(originalData.form);
      setHistory(originalData.history);
    }
    setError("");
    setIsEditing(false);
  };

  const addHistoryRow = () => setHistory((h) => [...h, { condition: "", diagnosedOn: "", notes: "" }]);
  const updateHistoryRow = (i, key, value) =>
    setHistory((h) => h.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeHistoryRow = (i) => setHistory((h) => h.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      bloodGroup: form.bloodGroup || undefined,
      address: form.address || undefined,
      medicalHistory: history
        .filter((h) => h.condition.trim())
        .map((h) => ({
          condition: h.condition.trim(),
          diagnosedOn: h.diagnosedOn || undefined,
          notes: h.notes || undefined,
        })),
    };
    try {
      if (exists) {
        await api.updatePatientProfile(payload);
        toast.success("Profile updated successfully.");
        setOriginalData({ form, history });
        setIsEditing(false);
      } else {
        await api.createPatientProfile(payload);
        toast.success("Profile created. You can now book consultations.");
        setExists(true);
        setOriginalData({ form, history });
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading patient profile" />;

  return (
    <form onSubmit={handleSubmit} className="card card-pad">
      <div className="spread" style={{ marginBottom: 18 }}>
        <span className="eyebrow">Patient Details</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {exists && !isEditing && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
          {!exists && <span className="badge badge-rust">Incomplete</span>}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="field-row">
        <div className="field">
          <label>Age</label>
          <input
            type="number"
            min="0"
            disabled={!isEditing}
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Gender</label>
          <select
            disabled={!isEditing}
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Blood Group</label>
          <select
            disabled={!isEditing}
            value={form.bloodGroup}
            onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
          >
            <option value="">Select…</option>
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
        <label>Address</label>
        <textarea
          disabled={!isEditing}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </div>

      <div className="spread" style={{ marginBottom: 10 }}>
        <label className="small-caps" style={{ margin: 0 }}>Medical History</label>
        {isEditing && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={addHistoryRow}>
            + Add Condition
          </button>
        )}
      </div>

      {history.length === 0 && <p className="faint" style={{ marginBottom: 14 }}>No medical conditions on record.</p>}

      {history.map((row, i) => (
        <div key={i} className="card card-pad" style={{ marginBottom: 12, background: "var(--paper)" }}>
          <div className="field-row">
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Condition</label>
              <input
                disabled={!isEditing}
                value={row.condition}
                onChange={(e) => updateHistoryRow(i, "condition", e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Diagnosed On</label>
              <input
                type="date"
                disabled={!isEditing}
                value={row.diagnosedOn}
                onChange={(e) => updateHistoryRow(i, "diagnosedOn", e.target.value)}
              />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Notes</label>
            <input
              disabled={!isEditing}
              value={row.notes}
              onChange={(e) => updateHistoryRow(i, "notes", e.target.value)}
            />
          </div>
          {isEditing && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeHistoryRow(i)}>
              Remove
            </button>
          )}
        </div>
      ))}

      {/* Only show Save and Cancel buttons when editing */}
      {isEditing && (
        <div className="row" style={{ gap: 12, marginTop: 16 }}>
          <button className="btn btn-rust" type="submit" disabled={saving}>
            {saving ? "Saving…" : exists ? "Save Changes" : "Create Profile"}
          </button>
          {exists && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Doctor profile                                                       */
/* ------------------------------------------------------------------ */

function DoctorProfileForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  const [form, setForm] = useState({ specialization: "", experience: "", qualification: "", consultationFee: "" });
  const [availability, setAvailability] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadDoctorProfile = async () => {
    try {
      const res = await api.getMyDoctorProfile();
      const d = res.data;
      const initialForm = {
        specialization: d.specialization || "",
        experience: d.experience ?? "",
        qualification: d.qualification || "",
        consultationFee: d.consultationFee ?? "",
      };
      const initialAvail = d.availability || [];

      setForm(initialForm);
      setAvailability(initialAvail);
      setOriginalData({ form: initialForm, availability: initialAvail });
      setExists(true);
      setIsEditing(false);
    } catch (err) {
      if (err.status === 404) {
        setExists(false);
        setIsEditing(true); // Open in edit mode if incomplete
      } else {
        toast.error(err.message || "Could not load your profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelEdit = () => {
    if (originalData) {
      setForm(originalData.form);
      setAvailability(originalData.availability);
    }
    setError("");
    setIsEditing(false);
  };

  const addAvailRow = () =>
    setAvailability((a) => [...a, { day: "Mon", startTime: "09:00", endTime: "17:00", slotDuration: 30 }]);
  const updateAvailRow = (i, key, value) =>
    setAvailability((a) => a.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeAvailRow = (i) => setAvailability((a) => a.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      specialization: form.specialization,
      experience: Number(form.experience),
      qualification: form.qualification,
      consultationFee: Number(form.consultationFee),
      availability: availability.map((a) => ({
        day: a.day,
        startTime: a.startTime,
        endTime: a.endTime,
        slotDuration: Number(a.slotDuration) || 30,
      })),
    };
    try {
      if (exists) {
        await api.updateDoctorProfile(payload);
        toast.success("Practice profile updated successfully.");
        setOriginalData({ form, availability });
        setIsEditing(false);
      } else {
        await api.createDoctorProfile(payload);
        toast.success("Profile created. An admin will verify your account before patients can book you.");
        setExists(true);
        setOriginalData({ form, availability });
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading doctor profile" />;

  return (
    <form onSubmit={handleSubmit} className="card card-pad">
      <div className="spread" style={{ marginBottom: 18 }}>
        <span className="eyebrow">Practice Details</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {exists && !isEditing && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
          {!exists && <span className="badge badge-rust">Incomplete</span>}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="field-row">
        <div className="field">
          <label>Specialization</label>
          <input
            required
            disabled={!isEditing}
            value={form.specialization}
            onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Experience (years)</label>
          <input
            required
            type="number"
            min="0"
            disabled={!isEditing}
            value={form.experience}
            onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
          />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Qualification</label>
          <input
            required
            disabled={!isEditing}
            value={form.qualification}
            onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Consultation Fee (₹)</label>
          <input
            required
            type="number"
            min="0"
            disabled={!isEditing}
            value={form.consultationFee}
            onChange={(e) => setForm((f) => ({ ...f, consultationFee: e.target.value }))}
          />
        </div>
      </div>

      <div className="spread" style={{ marginBottom: 10 }}>
        <label className="small-caps" style={{ margin: 0 }}>Weekly Availability</label>
        {isEditing && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={addAvailRow}>
            + Add Day
          </button>
        )}
      </div>

      {availability.length === 0 && <p className="faint" style={{ marginBottom: 14 }}>No availability set — patients won't be able to see valid slots.</p>}

      {availability.map((row, i) => (
        <div key={i} className="card card-pad" style={{ marginBottom: 12, background: "var(--paper)" }}>
          <div className="field-row">
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Day</label>
              <select
                disabled={!isEditing}
                value={row.day}
                onChange={(e) => updateAvailRow(i, "day", e.target.value)}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Start Time</label>
              <input
                type="time"
                disabled={!isEditing}
                value={row.startTime}
                onChange={(e) => updateAvailRow(i, "startTime", e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>End Time</label>
              <input
                type="time"
                disabled={!isEditing}
                value={row.endTime}
                onChange={(e) => updateAvailRow(i, "endTime", e.target.value)}
              />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Slot Length (min)</label>
              <input
                type="number"
                min="5"
                step="5"
                disabled={!isEditing}
                value={row.slotDuration}
                onChange={(e) => updateAvailRow(i, "slotDuration", e.target.value)}
              />
            </div>
          </div>
          {isEditing && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeAvailRow(i)}>
              Remove
            </button>
          )}
        </div>
      ))}

      {/* Only show Save and Cancel buttons when editing */}
      {isEditing && (
        <div className="row" style={{ gap: 12, marginTop: 16 }}>
          <button className="btn btn-rust" type="submit" disabled={saving}>
            {saving ? "Saving…" : exists ? "Save Changes" : "Create Profile"}
          </button>
          {exists && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
  );
}
