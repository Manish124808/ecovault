# ♻ EcoVault — Full-Stack MERN E-Waste Recycling Platform

India's trusted e-waste recycling platform built with React + Node.js + MongoDB + Firebase Auth.

---

## 🏗️ Architecture

```
ecovault/
│
├── client/                     ← React + Vite (Frontend)
│   ├── src/
│   │   ├── main.jsx            ← Entry point
│   │   ├── App.jsx             ← Router + AuthProvider
│   │   ├── context/
│   │   │   └── AuthContext.jsx ← Firebase auth state + role detection
│   │   ├── services/
│   │   │   ├── firebase.js     ← Firebase init
│   │   │   ├── api.js          ← Axios wrapper (auto attaches ID token)
│   │   │   └── certificate.js  ← jsPDF certificate generator
│   │   ├── pages/
│   │   │   ├── Home.jsx        ← Landing page with live stats
│   │   │   ├── Login.jsx       ← Role select + Google OAuth
│   │   │   ├── BookingFlow.jsx ← 4-step booking wizard
│   │   │   ├── Dashboard.jsx   ← Customer: my bookings + wallet
│   │   │   ├── AdminDashboard.jsx ← Admin: charts, users, payments
│   │   │   ├── RecyclerPanel.jsx  ← Recycler: assigned pickups
│   │   │   └── AIChat.jsx      ← Gemini AI chat + price estimator
│   │   ├── components/
│   │   │   ├── Navbar.jsx      ← Role-based navigation
│   │   │   ├── BookingCard.jsx ← Reusable card (user/admin/recycler)
│   │   │   ├── Toast.jsx       ← Notification toast
│   │   │   ├── Loader.jsx      ← Spinner
│   │   │   └── modals/
│   │   │       ├── EmailModal.jsx       ← Admin email sender
│   │   │       ├── PaymentModal.jsx     ← UPI + Razorpay payment
│   │   │       ├── TrackingModal.jsx    ← Live pickup tracking
│   │   │       └── PriceEstimatorModal.jsx ← AI price estimation
│   │   └── styles/
│   │       └── global.css      ← All CSS (exact same design as original)
│   └── index.html
│
└── server/                     ← Node.js + Express (Backend)
    ├── server.js               ← Entry point
    ├── config/
    │   └── db.js               ← MongoDB Atlas connection
    ├── middleware/
    │   └── auth.js             ← Firebase Admin token verification
    ├── models/
    │   ├── Booking.js          ← Mongoose schema
    │   ├── User.js             ← Mongoose schema
    │   └── Recycler.js         ← Mongoose schema
    ├── routes/
    │   ├── bookings.js         ← Full CRUD + status + stats
    │   ├── users.js            ← Login sync + role detection
    │   ├── recyclers.js        ← Admin recycler management
    │   ├── ai.js               ← Gemini chat proxy + price engine
    │   └── payments.js         ← Razorpay order + verify
    └── services/
        └── email.js            ← Beautiful HTML emails (Nodemailer)
```

---

## 🔌 API Reference

| Method | Endpoint                      | Auth     | Description                        |
|--------|-------------------------------|----------|------------------------------------|
| GET    | `/api/health`                 | None     | Health check                       |
| GET    | `/api/bookings`               | Token    | All bookings (admin) / own (user)  |
| GET    | `/api/bookings/stats`         | Admin    | Analytics stats for charts         |
| GET    | `/api/bookings/recycler`      | Recycler | Recycler's assigned pickups        |
| POST   | `/api/bookings`               | Token    | Create new booking                 |
| PATCH  | `/api/bookings/:id/status`    | Token    | Update pickup status               |
| PATCH  | `/api/bookings/:id/payment`   | Admin    | Mark reward as paid                |
| DELETE | `/api/bookings/:id`           | Admin    | Delete booking                     |
| GET    | `/api/users`                  | Admin    | All users                          |
| POST   | `/api/users/sync`             | Token    | Upsert user on login               |
| GET    | `/api/users/role`             | Token    | Detect user role (user/recycler/admin) |
| GET    | `/api/recyclers`              | Admin    | All recyclers                      |
| POST   | `/api/recyclers`              | Admin    | Register new recycler              |
| DELETE | `/api/recyclers/:id`          | Admin    | Remove recycler                    |
| POST   | `/api/ai/chat`                | None     | Gemini AI chat                     |
| POST   | `/api/ai/estimate`            | None     | Price estimation engine            |
| POST   | `/api/payments/order`         | Admin    | Create Razorpay order              |
| POST   | `/api/payments/verify`        | Admin    | Verify Razorpay signature          |
| GET    | `/api/payments/key`           | None     | Get Razorpay public key            |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Firebase project
- Razorpay test account
- Gmail with App Password enabled

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/ecovault.git
cd ecovault
npm install          # installs concurrently
npm run install:all  # installs server + client deps
```

### 2. Server `.env`
```bash
cp server/.env.example server/.env
# Fill in all values
```

### 3. Client `.env`
```bash
cp client/.env.example client/.env
# Fill in all values
```

### 4. Firebase Admin Key
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy `project_id`, `client_email`, `private_key` into `server/.env`

### 5. Run both servers
```bash
npm run dev
# Server → http://localhost:5000
# Client → http://localhost:5173
```

---

## 🌐 Deploy to Vercel (Frontend)

```bash
cd client
npm run build
# Upload dist/ to Vercel OR connect GitHub repo
```

Set these environment variables in Vercel dashboard:
- All `VITE_*` variables from `client/.env.example`
- Set `VITE_API_URL` to your backend URL (e.g. `https://ecovault-api.onrender.com/api`)

## 🖥️ Deploy Backend (Render.com — Free)

1. Push `server/` folder to GitHub
2. New Web Service → Connect repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add all server env variables in Render dashboard
6. Add your Render URL to Firebase Authorized Domains

---

## 🔑 Role System

| Role      | How assigned                        | Access                              |
|-----------|-------------------------------------|-------------------------------------|
| `admin`   | Email matches `ADMIN_EMAIL` in .env | Full dashboard, payments, analytics |
| `recycler`| Email in Recyclers collection       | Assigned pickups, status updates    |
| `user`    | Everyone else                       | Book pickups, track, certificates   |

### Auth Flow
1. User signs in with Google
2. Firebase ID Token issued
3. Client sends token in `Authorization: Bearer <token>` header
4. Server verifies token via Firebase Admin SDK
5. Role checked: admin → email match | recycler → Mongo lookup | user → default

---

## 📦 Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | React 18, Vite, React Router v6        |
| Auth        | Firebase Google OAuth + Admin SDK      |
| Backend     | Node.js, Express.js                    |
| Database    | MongoDB Atlas + Mongoose               |
| AI          | Google Gemini Pro (via REST API)       |
| Email       | Nodemailer (Gmail) + EmailJS (client)  |
| Payments    | Razorpay (test mode)                   |
| PDF         | jsPDF                                  |
| Charts      | Chart.js + react-chartjs-2             |
| Deploy      | Vercel (frontend) + Render (backend)   |

---

## 🎤 Interview Talking Points

**"How is authentication handled?"**
> Firebase Google OAuth issues an ID token in the client. Every API request sends this token in the Authorization header. The Express middleware uses Firebase Admin SDK to verify it server-side — no JWT secrets to manage.

**"How does role-based access work?"**
> Three roles: admin (email match in .env), recycler (MongoDB lookup), user (default). The `/api/users/role` endpoint checks on every login and returns the role. React's AuthContext stores it and guards routes accordingly.

**"Why MongoDB instead of just Firestore?"**
> MongoDB gives full server-side control — complex aggregation queries for analytics, proper indexing, and no per-read billing. The stats API does 5 parallel aggregate queries that would be expensive/impossible in Firestore.

**"How does auto recycler assignment work?"**
> On booking creation, the server queries the Recyclers collection for a document matching the booking's city. If found, that recycler's name is stored on the booking. No manual assignment needed.

**"How are emails sent?"**
> Backend uses Nodemailer with Gmail App Password — fully server-controlled, beautiful HTML templates, no third-party dependency. Client uses EmailJS only for the admin's manual email modal.
