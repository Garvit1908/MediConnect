// In production on Vercel, requests point to the deployed Render backend URL
// (via import.meta.env.VITE_API_BASE_URL or fallback to Render). In dev, it falls back to "/api/v1"
// which is proxied by Vite dev server.
const API_HOST =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://mediconnect-32xp.onrender.com" : "");
const BASE = `${API_HOST}/api/v1`;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function parseBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function request(path, { method = "GET", body, isForm = false, retry = true } = {}) {
  const opts = {
    method,
    credentials: "include", // send/receive the httpOnly cookies
  };

  if (body !== undefined) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE}${path}`, opts);

  // Transparent single-retry refresh: if the access token expired, try to
  // silently rotate it via the refresh cookie, then replay the request once.
  if (res.status === 401 && retry && path !== "/auth/refresh-token" && path !== "/auth/login") {
    const refreshRes = await fetch(`${BASE}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      return request(path, { method, body, isForm, retry: false });
    }
  }

  const data = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

export const api = {
  // ---- auth ----
  sendOtp: (email) => request("/auth/send-otp", { method: "POST", body: { email } }),
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  googleAuth: (payload) => request("/auth/google", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "POST" }),
  forgotPasswordOtp: (email) => request("/auth/forgot-password-otp", { method: "POST", body: { email } }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  updateProfilePicture: (file) => {
    const fd = new FormData();
    fd.append("profilePic", file);
    return request("/auth/profile-picture", { method: "PUT", body: fd, isForm: true });
  },

  // ---- patients ----
  getMyPatientProfile: () => request("/patients/me"),
  createPatientProfile: (payload) => request("/patients", { method: "POST", body: payload }),
  updatePatientProfile: (payload) => request("/patients/me", { method: "PUT", body: payload }),
  getPatientById: (id) => request(`/patients/${id}`),

  // ---- doctors ----
  getMyDoctorProfile: () => request("/doctors/me"),
  createDoctorProfile: (payload) => request("/doctors", { method: "POST", body: payload }),
  updateDoctorProfile: (payload) => request("/doctors/me", { method: "PUT", body: payload }),
  getDoctors: (queryString) => request(`/doctors${queryString ? `?${queryString}` : ""}`),
  getDoctorById: (id) => request(`/doctors/${id}`),
  verifyDoctor: (id, isVerified = true) =>
    request(`/doctors/${id}/verify`, { method: "PATCH", body: { isVerified } }),

  // ---- appointments ----
  bookAppointment: (payload) => request("/appointments", { method: "POST", body: payload }),
  getMyAppointments: () => request("/appointments/my"),
  getAppointmentById: (id) => request(`/appointments/${id}`),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: "PUT" }),
  updateAppointment: (id, payload) => request(`/appointments/${id}`, { method: "PUT", body: payload }),

  // ---- payments ----
  createOrder: (appointmentId) => request("/payments/create-order", { method: "POST", body: { appointmentId } }),
  verifyPayment: (payload) => request("/payments/verify-payment", { method: "POST", body: payload }),
  getMyPayments: () => request("/payments/my"),

  // ---- prescriptions ----
  createPrescription: (payload) => request("/prescriptions", { method: "POST", body: payload }),
  getMyPrescriptions: () => request("/prescriptions/my"),
  getPrescriptionByAppointmentId: (appointmentId) => request(`/prescriptions/appointment/${appointmentId}`),
  getPrescriptionById: (id) => request(`/prescriptions/${id}`),
  updatePrescription: (id, payload) => request(`/prescriptions/${id}`, { method: "PUT", body: payload }),

  // ---- medical records ----
  uploadMedicalRecord: (formData) => request("/medical-records", { method: "POST", body: formData, isForm: true }),
  getMyMedicalRecords: () => request("/medical-records/my"),
  getPatientMedicalRecords: (patientId) => request(`/medical-records/patient/${patientId}`),
  getMedicalRecordById: (id) => request(`/medical-records/${id}`),
  deleteMedicalRecord: (id) => request(`/medical-records/${id}`, { method: "DELETE" }),
};

export { ApiError };
