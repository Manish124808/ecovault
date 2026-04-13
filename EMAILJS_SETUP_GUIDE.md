# EmailJS Setup — EcoVault Complete Guide

## The Root Cause of Blank Emails

Your EmailJS template uses variable names like `{{status}}`, `{{order_id}}` etc.
If the variable name in the template does NOT exactly match what the server sends,
EmailJS renders it as blank/empty. This guide fixes that permanently.

---

## Step 1 — Replace Your EmailJS Template

1. Go to https://dashboard.emailjs.com
2. Click **Email Templates** in the left sidebar
3. Click your existing template (template_62l9lfe) to open it
4. Click **Edit** or open the template editor

### Subject line — paste this exactly:
```
EcoVault: {{subject}}
```
*(or just use `{{subject}}` — the server already builds the full subject)*

### Body — switch to HTML mode and paste the ENTIRE content of `EMAILJS_TEMPLATE.html`

> To switch to HTML: In the template editor, look for a toggle or tab that says
> **"HTML"** or **"Code Editor"** or **"Source"** — click it, then paste.

5. Click **Save**

---

## Step 2 — Set the "To Email" field correctly

In your template settings (the fields above the body editor):

| Field       | Value              |
|-------------|--------------------|
| **To Email**   | `{{to_email}}`  |
| **To Name**    | `{{to_name}}`   |
| **From Name**  | `{{from_name}}` |
| **Reply To**   | `{{reply_to}}`  |
| **Subject**    | `{{subject}}`   |

> ⚠️ CRITICAL: The **To Email** field MUST be `{{to_email}}` — not hardcoded.
> If it's hardcoded to your own email, all emails go to you, not the customer.

---

## Step 3 — Verify Render Environment Variables

In your Render dashboard → Your server service → **Environment**:

| Variable              | Where to get it                              |
|-----------------------|----------------------------------------------|
| `EMAILJS_SERVICE_ID`  | EmailJS Dashboard → Email Services → Service ID |
| `EMAILJS_TEMPLATE_ID` | EmailJS Dashboard → Email Templates → Template ID |
| `EMAILJS_PUBLIC_KEY`  | EmailJS Dashboard → Account → General → Public Key |
| `EMAILJS_PRIVATE_KEY` | EmailJS Dashboard → Account → Security → Private Key (optional but recommended) |
| `ADMIN_EMAIL`         | Your admin Gmail address                     |

---

## Step 4 — Test it

After deploying, create a test booking. You should receive an email with:
- ✅ Correct customer name
- ✅ Booking ID (e.g. `#A1B2C3D4`)
- ✅ Device, Date, Slot filled in
- ✅ Status showing "Confirmed"
- ✅ Reward amount
- ✅ Recycler name

---

## Variables the server sends (all of these work in your template)

| Variable         | Example Value           |
|------------------|------------------------|
| `{{to_email}}`   | manish@gmail.com       |
| `{{to_name}}`    | manish kumar           |
| `{{subject}}`    | EcoVault: Pickup Confirmed — #A1B2C3D4 |
| `{{message}}`    | Full text summary      |
| `{{booking_id}}` | #A1B2C3D4              |
| `{{status}}`     | Confirmed              |
| `{{device}}`     | Smartphone (Qty: 1)    |
| `{{condition}}`  | Working - Good         |
| `{{pickup_date}}`| 2026-04-15             |
| `{{pickup_slot}}`| Morning (9AM-12PM)     |
| `{{city}}`       | Delhi                  |
| `{{address}}`    | 123 Main St            |
| `{{recycler}}`   | Green Recycler Delhi   |
| `{{reward}}`     | Rs. 500                |
| `{{upi}}`        | manish@okaxis          |
| `{{payment_status}}` | Pending           |
| `{{from_name}}`  | EcoVault Team          |
| `{{reply_to}}`   | admin@gmail.com        |

