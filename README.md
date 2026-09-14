<div align="center">
  <img src="mediconnect-frontend/src/assets/logo.png" alt="MediConnect Logo" width="100" height="100" />
  <h1>MediConnect</h1>
  <p><strong>Full-stack telehealth platform with role-based access control, WebRTC consultations, Razorpay payments, Cloudinary storage, and Resend transactional email.</strong></p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
    <a href="https://webrtc.org/"><img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" /></a>
    <a href="https://resend.com/"><img src="https://img.shields.io/badge/Resend_Email-000000?style=for-the-badge&logo=resend&logoColor=white" alt="Resend" /></a>
    <a href="https://razorpay.com/"><img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" alt="Razorpay" /></a>
  </p>

 <p>
    <code>Features</code> &nbsp;•&nbsp;
    <code>Architecture</code> &nbsp;•&nbsp;
    <code>Tech Stack</code> &nbsp;•&nbsp;
    <code>Security</code> &nbsp;•&nbsp;
    <code>Quick Start</code> &nbsp;•&nbsp;
    <code>Deployment</code>
  </p>
</div>

---

## 🌟 Key Features

### 🩺 For Patients
* **Doctor Discovery & Filters**: Filter doctors dynamically by medical specialization, maximum fee, and years of clinical experience.
* **Smart Conflict-Free Slot Booking**: Dynamic calendar generating time slots strictly aligned with doctor availability schedules, backed by atomic database constraints.
* **Seamless Payment Integration**: Razorpay payment gateway integration with signature verification.
* **Encrypted 1-on-1 Video Visits**: Direct peer-to-peer browser video visits powered by WebRTC.
* **Digital Health Records**: Securely upload and access lab reports, past prescriptions.

### 👨‍⚕️ For Doctors
* **Practice & Schedule Management**: Configure clinical bio, consultation fee, and weekly recurring slot availability.
* **Appointment Management**: Track upcoming, completed, and canceled patient consultations with one-click room access.
* **Digital Prescription Studio**: Issue structured digital prescriptions with medicine dosages, intake timings, duration, and clinical notes.
* **In-Consultation Clinical Workspace**: Interactive WebRTC consultation room, patient history review, and instant prescription dispatch.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client (React 18 + Vite)"]
        UI["Patient & Doctor Portals"]
        RTC["WebRTC Media Engine"]
    end

    subgraph Server["Backend API (Node.js + Express)"]
        API["REST Endpoints (/api/v1)"]
        SOCKET["Socket.IO Signaling Server"]
        AUTH["JWT & HttpOnly Cookie Auth"]
    end

    subgraph Services["Cloud Services & Datastores"]
        MONGO[("MongoDB Atlas")]
        RAZOR["Razorpay Payment Gateway"]
        CLOUDINARY["Cloudinary Media CDN"]
        RESEND["Resend Email API (Custom Domain)"]
    end

    UI -->|"HTTPS REST API"| API
    UI -->|"WSS Real-Time Events"| SOCKET
    API --> AUTH
    AUTH --> MONGO
    API --> MONGO
    API --> RAZOR
    API --> CLOUDINARY
    API --> RESEND
    SOCKET <-->|"SDP Offer / Answer & ICE Candidates"| RTC
    RTC <===>|"Direct Encrypted P2P Audio/Video"| RTC
```

---

## 🛡️ Security & Reliability

* **Secure Authentication**: JWT-based login using secure `HttpOnly` cookies and automatic token refresh.
* **Reliable Email Delivery**: Uses **Resend HTTP API** with a verified custom domain for transactional email delivery.
* **Double-Booking Prevention**: Database constraints ensure no slot can ever be booked twice by multiple users.
* **Role-Based Privacy**: Strict access controls so patients and doctors can only access their own records and visits.

---

## 💻 Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, Vite |
| **Backend** | Node.js, Express, Socket.IO, Mongoose  |
| **Database** | MongoDB  |
| **Real-time Video** | WebRTC (`RTCPeerConnection`), Google STUN servers |
| **Payments** | Razorpay Orders API + Cryptographic Verification |
| **Cloud Storage** | Cloudinary & Multer Stream Storage |
| **Email API** | Resend HTTP API (Custom Domain Verified) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Razorpay Test Account
- Cloudinary Account
- Resend Account (API Key)

### 1. Setup Backend
```bash
cd Backend
npm install
```

Create `Backend/.env`:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=15d

CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_key
API_SECRET=your_cloudinary_secret

RAZORPAY_KEY_ID=rzp_test_your_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

RESEND_API_KEY=re_your_resend_api_key
MAIL_FROM="MediConnect <no-reply@mediconnecthealth.me>"
```

Run Backend:
```bash
npm run dev
```

### 2. Setup Frontend
```bash
cd mediconnect-frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.



## 📁 Project Structure

```text
MediConnect/
├── Backend/
│   ├── config/             # DB, Cloudinary, and Razorpay configs
│   ├── controllers/        # Auth, Appointment, Doctor, Patient, Records, Payment
│   ├── middleware/         # Auth verification, CSRF guards, Multer filters
│   ├── models/             # User, Doctor, Appointment, Prescription, etc.
│   ├── routes/             # Express route definitions
│   ├── socket/             # WebRTC signaling & room management
│   ├── utils/              # Resend email client & HTML templates
│   └── index.js            # Express app & Socket server entrypoint
│
├── mediconnect-frontend/
│   ├── src/
│   │   ├── components/     # UI components, Navbar, Cards, Modals
│   │   ├── lib/            # Axios API client, Auth context, Helpers
│   │   ├── pages/          # Landing, Booking, Appointments, ConsultationRoom, etc.
│   │   └── styles/         # Global design tokens and animations
│   └── vite.config.js
│
├── docker-compose.yml
└── README.md
```

---

## 📄 License
This project is open source and licensed under the MIT License.
