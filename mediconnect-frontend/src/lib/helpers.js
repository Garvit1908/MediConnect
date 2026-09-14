// Mirrors the backend's day-of-week mapping exactly (controllers/appointment.controller.js)
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayFor(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return WEEKDAYS[date.getDay()];
  }
  return WEEKDAYS[new Date(dateStr).getDay()];
}

// Generates candidate slot strings ("09:00", "09:30", ...) between startTime
// and endTime (exclusive of endTime) at slotDuration-minute steps. This is a
// client-side convenience only — the backend is the source of truth and will
// reject anything outside the doctor's real availability or already booked.
export function generateSlots(startTime, endTime, slotDuration = 30) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const slots = [];
  for (let t = start; t < end; t += slotDuration) {
    const h = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

export function todayISODate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatINR(amount) {
  if (amount === undefined || amount === null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

// ---------- Local "already paid" cache ----------
// The backend exposes no GET endpoint to read a payment's status for an
// appointment (only create-order + verify-payment). We therefore track a
// confirmed-paid flag locally once verify-payment succeeds, and also set it
// when create-order tells us the payment was already completed. This is a
// convenience cache only — every payment attempt is still verified for real
// against the backend/Razorpay; this never grants access on its own.
const PAID_CACHE_KEY = "mediconnect_paid_appointments";

function readPaidCache() {
  try {
    return JSON.parse(localStorage.getItem(PAID_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function isMarkedPaid(appointmentId) {
  return Boolean(readPaidCache()[appointmentId]);
}

export function markPaid(appointmentId) {
  const cache = readPaidCache();
  cache[appointmentId] = true;
  localStorage.setItem(PAID_CACHE_KEY, JSON.stringify(cache));
}

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Could not load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

export const STATUS_BADGE = {
  pending: "badge-amber",
  confirmed: "badge-teal",
  completed: "badge-teal",
  cancelled: "badge-red",
  failed: "badge-red",
  paid: "badge-teal",
};

// Returns true if a slot's date+time is in the past (or within `graceMinutes`
// before the slot). Used to prevent early "Mark as Completed" by doctors and
// to filter out unselectable past time slots when booking for today.
export function isSlotInPast(dateStr, timeStr, graceMinutes = 0) {
  if (!dateStr || !timeStr) return false;
  const parts = dateStr.split("T")[0].split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  const slotDate = new Date(parts[0], parts[1] - 1, parts[2], h, m, 0, 0);
  const now = new Date();
  now.setMinutes(now.getMinutes() - graceMinutes);
  return slotDate <= now;
}

// Returns true if slot date+time is reachable (i.e. hasn't fully passed yet).
// A 30-min grace is given so consultations that started can still be completed.
export function isSlotReachable(dateStr, timeStr) {
  return !isSlotInPast(dateStr, timeStr, -30);
}

// Converts "14:30" → "2:30 PM"
export function formatTime(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// Determines whether the live video consultation room is accessible.
// Window: 30 minutes before slot time until 60 minutes after slot time.
// Doctors can always start or enter a confirmed session.
export function getConsultationAccess(dateStr, timeStr, status, role = "") {
  if (!status || status === "pending") {
    return { allowed: false, reason: "Payment pending. Please complete payment to confirm your appointment and unlock the consultation room." };
  }
  if (status === "completed") {
    return { allowed: false, reason: "This appointment session has already concluded." };
  }
  if (status === "cancelled") {
    return { allowed: false, reason: "This appointment has been cancelled." };
  }
  if (status !== "confirmed") {
    return { allowed: false, reason: `Appointment is not confirmed (${status}).` };
  }
  if (!dateStr || !timeStr) {
    return { allowed: false, reason: "Invalid appointment schedule." };
  }

  // Doctors and Admins can always start/enter a confirmed session
  if (role === "doctor" || role === "admin") {
    return { allowed: true };
  }

  const parts = dateStr.split("T")[0].split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  const slotDate = new Date(parts[0], parts[1] - 1, parts[2], h, m, 0, 0);
  const now = new Date();

  // Window starts 30 minutes before scheduled time
  const windowStart = new Date(slotDate.getTime() - 30 * 60 * 1000);
  // Window closes 120 minutes after scheduled time to accommodate running consultations
  const windowEnd = new Date(slotDate.getTime() + 120 * 60 * 1000);

  if (now < windowStart) {
    const diffMs = windowStart - now;
    const diffMin = Math.ceil(diffMs / (60 * 1000));
    const timeLabel = diffMin >= 60 ? `${Math.floor(diffMin / 60)}h ${diffMin % 60}m` : `${diffMin}m`;
    return {
      allowed: false,
      isEarly: true,
      reason: `Consultation room will open 30 minutes before scheduled time (${formatTime(timeStr)}). Opens in ~${timeLabel}.`,
      opensAt: windowStart,
    };
  }

  if (now > windowEnd) {
    return {
      allowed: false,
      isExpired: true,
      reason: `Consultation time window for this appointment has expired. Please contact support or your doctor if you missed the session.`,
    };
  }

  return { allowed: true };
}

