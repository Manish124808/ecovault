# 🚀 EcoVault — Quick Setup Guide

## Step 1 — Fill in the Missing Keys

Open `server/.env` and replace these placeholders:

### 1a. MongoDB Password
Replace `YOUR_DB_PASSWORD` in the MONGO_URI line:
```
MONGO_URI=mongodb+srv://mk124808:YOUR_DB_PASSWORD@ecovault.g1chr0p.mongodb.net/ecovault?...
```
→ Use the password for your `mk124808` Atlas user.

### 1b. Firebase Admin Private Key (most important!)
Go to: **Firebase Console → Project Settings → Service Accounts → Generate new private key**
Download the JSON file, then copy:
- `client_email` → paste into `FIREBASE_CLIENT_EMAIL`
- `private_key`  → paste into `FIREBASE_PRIVATE_KEY` (keep the quotes)

### 1c. Razorpay Secret
Go to: **razorpay.com → Settings → API Keys**
Copy the Key Secret → paste into `RAZORPAY_KEY_SECRET`

### 1d. Email (Gmail App Password)
1. Enable 2FA on your Google Account
2. Go to: myaccount.google.com → Security → App Passwords
3. Generate an app password for "Mail"
4. Paste 16-char password into `EMAIL_PASS`
5. Set `EMAIL_USER` and `EMAIL_FROM` to your Gmail address
6. Set `ADMIN_EMAIL` to your admin Gmail

---

## Step 2 — Install Dependencies

```bash
# From the project root (ecovault folder):
npm run install:all

# OR manually:
cd server && npm install
cd ../client && npm install
```

---

## Step 3 — Run the App

```bash
# From root — starts both server and client together:
npm run dev

# OR separately:
npm run dev:server   # backend on http://localhost:5000
npm run dev:client   # frontend on http://localhost:5173
```

Open: **http://localhost:5173**

---

## ✅ Checklist

- [ ] MongoDB password filled in `server/.env`
- [ ] Firebase Admin private key filled in `server/.env`
- [ ] Razorpay secret filled in `server/.env`
- [ ] Gmail app password filled in `server/.env`
- [ ] Admin email set in `server/.env`
- [ ] `npm run install:all` completed
- [ ] `npm run dev` running

---

## 🔑 Keys Summary

| Key | Where to Get | File |
|-----|-------------|------|
| MongoDB password | Atlas → Database Access | server/.env |
| Firebase Admin private key | Firebase Console → Service Accounts | server/.env |
| Razorpay Key Secret | razorpay.com → API Keys | server/.env |
| Gmail App Password | myaccount.google.com → App Passwords | server/.env |
| All other keys | Already filled in ✅ | both .env files |

---

## 📁 Project Structure

```
ecovault/
├── server/          # Express + MongoDB backend (port 5000)
│   ├── .env         ← YOUR CONFIG FILE
│   ├── server.js
│   ├── routes/      # bookings, users, recyclers, ai, payments
│   ├── models/      # User, Recycler, Booking
│   ├── middleware/  # auth (Firebase Admin)
│   ├── services/    # email.js
│   └── config/      # db.js
├── client/          # React + Vite frontend (port 5173)
│   ├── .env         ← YOUR CONFIG FILE
│   └── src/
│       ├── pages/   # Home, Login, Dashboard, AdminDashboard, BookingFlow, AIChat, RecyclerPanel
│       ├── components/
│       ├── context/ # AuthContext
│       └── services/ # api.js, firebase.js, certificate.js
└── package.json     # Root scripts
```
