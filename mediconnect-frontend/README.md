# MediConnect — Frontend

A React (Vite) frontend for the MediConnect backend — patient/doctor auth,
doctor directory, appointment booking, Razorpay-verified payments,
prescriptions, and medical records. Built to match the backend's routes and
controllers **exactly**, with zero backend changes required.

## Design

"Clinical ledger" visual language: paper background, ink text, one rust
accent for brand/CTAs and one teal accent for confirmed/paid states.
Fraunces (serif display) + Source Serif 4 (body) + IBM Plex Mono (labels,
data, timestamps) — no gradient-and-glassmorphism AI-template look.

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Make sure your backend is running first
(default assumed at `http://localhost:4000` — see below to change that).

## Zero-CORS setup — read this

Your backend has **no CORS middleware** configured, and per your
instructions it hasn't been touched. Rather than ask you to add CORS (which
would mean editing backend code), this frontend avoids the problem
entirely: `vite.config.js` proxies every `/api/v1/*` request to your
backend **server-side**. The browser only ever talks to one origin (the
Vite dev server), so:

- No CORS headers are needed on the backend.
- Cookies (`accessToken` / `refreshToken`) work exactly like a same-origin
  app — they're set and read normally.

If your backend runs somewhere other than `http://localhost:4000`, point
the proxy at it:

```bash
BACKEND_URL=http://localhost:5000 npm run dev
```

**For production**, you'll need the same trick: serve this app's built
`dist/` output from behind the same reverse proxy / domain as the API (so
`/api/v1` on your domain forwards to the Node server), or put both behind
Nginx with a matching `location /api/v1 { proxy_pass ... }` block. Either
way, no backend code changes are needed — this is a proxy/infra concern,
not an application one. (If you'd rather add `cors` + `credentials: true`
to the backend at some point, that also works and removes the need for the
proxy — but that's a backend change I did not make, per your instructions.)

## What's implemented

- **Auth** — signup (email OTP → verify), login, logout, session bootstrap
  via `/auth/me`, silent one-shot refresh-token retry on 401.
- **Profiles** — patient profile (age/gender/blood group/address/medical
  history) and doctor profile (specialization/experience/fee + a weekly
  availability editor), both create-or-update aware.
- **Doctor directory** — search/filter by specialization, max fee, min
  experience; public doctor detail page.
- **Booking** — slot times are generated client-side from the doctor's
  `availability` (day/startTime/endTime/slotDuration) so patients only ever
  see plausible slots; the backend still validates and is the source of
  truth (a race for the same slot surfaces as a normal error toast).
- **Appointments** — list, detail, cancel, reschedule (date+time), and
  doctor-side status transitions (pending → confirmed → completed).
- **Payments** — Razorpay Checkout.js loaded on demand; creates an order,
  opens checkout, and verifies the signature server-side via
  `/payments/verify-payment` before marking anything paid in the UI.
- **Prescriptions** — doctor creates one once an appointment is
  `completed`; both sides can view it; doctor can edit.
- **Medical records** — patient upload (multipart), list, view file, delete.

## Known backend limitations (not fixed — no backend edits made)

- **No "is this appointment paid?" read endpoint.** Only `create-order` and
  `verify-payment` exist. The frontend tracks a paid flag in
  `localStorage` once `verify-payment` succeeds (and reconciles it if
  `create-order` reports the payment was already completed). This is a
  convenience cache only — it never grants access on its own, and a fresh
  browser/device will simply show "Pay Now" again until it re-verifies.
  If you add a `GET /payments/appointment/:id` style endpoint later, swap
  `PaymentPanel` in `src/pages/AppointmentDetail.jsx` to use it instead of
  the local cache.
- **No endpoint to see a doctor's already-booked slots for a given date.**
  The booking form generates *candidate* slots from the doctor's weekly
  availability only; a slot someone else already took will be rejected by
  the backend at submit time with a normal error message, not grayed out
  in advance.
- **3-Portal RBAC (Patient, Doctor, Admin):** Full admin console at `/admin`
  for medical license compliance, verifying/approving doctors, and viewing platform
  metrics. Configured with primary administrator via environment variables
  with automatic bootstrap seeding on server startup.

## Structure

```
src/
  lib/        api client, auth context, toast context, small helpers
  components/ Navbar, Footer, cards, badges, ProtectedRoute
  pages/      one file per route (see src/App.jsx for the route table)
  styles/     globals.css — the whole design system as CSS variables
```
