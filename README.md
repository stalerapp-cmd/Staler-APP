# S-Taler — Digital Payment Platform

A secure, bilingual (Arabic & English) digital payment platform built for the Palestinian market. Combines a digital wallet, an e-commerce marketplace, QR-code payments, wallet-to-wallet transfers, and a real banking layer (LibEuFin / GNU Taler) — all integrated into one web application.

**Live application:** [http://s-taler.duckdns.org](http://s-taler.duckdns.org)
**Bank WebUI:** [http://s-taler.duckdns.org/bank/webui/#/](http://s-taler.duckdns.org/bank/webui/#/)

---
## <img width="962" height="1184" alt="aws2 drawio (1)" src="https://github.com/user-attachments/assets/094854fd-b9dd-46eb-8a6d-de05c7cbaeb8" />
<img width="962" height="1184" alt="aws2 drawio (1)" src="https://github.com/user-attachments/assets/dc903021-ff1e-4941-9a62-cd1c8b58e612" />
<img width="962" height="1184" alt="aws2 drawio (1)" src="https://github.com/user-attachments/assets/9a0a1f6a-5921-4921-bb91-fbc0b2077878" />
 Demo Video

[![S-Taler Demo](https://img.youtube.com/vi/6_f7TY62vM0/maxresdefault.jpg)](https://youtu.be/6_f7TY62vM0)

> 🎬 **[Watch the full demo on YouTube](https://youtu.be/6_f7TY62vM0)**

##  Tools & Technologies

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, react-i18next (RTL + LTR) |
| Backend | Node.js, Express, JWT, bcrypt (cost = 10), Nodemailer |
| Database | PostgreSQL via Supabase (managed cloud) — 24 tables, Row-Level Security |
| Bank | LibEuFin (GNU Taler, Java / Kotlin) |
| Exchange | Taler Exchange |
| QR | `qrcode.react` (generation) + `html5-qrcode` (scanner) |
| Reverse Proxy | Nginx |
| Cloud | AWS EC2, ALB, Auto Scaling Group, Lambda, Elastic IP, NAT Gateway, Bastion Host |
| DNS | DuckDNS |
| Email | Gmail SMTP |

---

## Architecture

<!--
  To embed the architecture diagram: open this README on github.com → click Edit
  → drag the architecture image (PNG / JPG / SVG) into the editor.
  GitHub uploads it and inserts the markdown image link automatically,
  replacing the line below.
-->

![S-Taler AWS Architecture](https://github.com/stalerapp-cmd/Staler-APP/assets/REPLACE_AFTER_UPLOAD)

---

## How to Run the Project

>  **S-Taler is not a typical `git clone && npm install && npm start` project.**
>
> The full stack depends on system-level services that **cannot be installed locally** in a simple way:
>
> - **LibEuFin Bank** — a Java service from GNU Taler that requires OpenJDK 21, custom `.deb` packages, a dedicated PostgreSQL database, dedicated system users (`libeufin-bank`), and a specific `bank.conf` file. It cannot be installed via `npm` or `pip`.
> - **Taler Exchange** — similar constraints, plus deep integration with the bank.
> - **Supabase credentials** — the `.env` file with API keys and URLs is **not** committed to the repository.
>
> **The recommended way to run and evaluate this project is the live deployment:**
>
> **[http://s-taler.duckdns.org](http://s-taler.duckdns.org)**
>
> You can register a free account and explore the full platform immediately. The merchant marketplace is also publicly visible without registration.

The steps below describe what a developer would do to reproduce the deployment from scratch on their own Linux server.

### 1. Clone the repository

```bash
git clone https://github.com/stalerapp-cmd/Staler-APP.git
cd Staler-APP
```

### 2. Install Node.js dependencies

The repository contains two Node projects — the React frontend and the Express backend:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Install the system-level services *(the hard part)*

These cannot be installed via `npm` or `pip`. They require root access, dedicated PostgreSQL databases, system users, and configuration files:

| Service | What's needed |
|---|---|
| **OpenJDK 21** | Required by LibEuFin and Taler Exchange |
| **LibEuFin Bank** | `.deb` package from GNU Taler · system user `libeufin-bank` · `/etc/libeufin/bank.conf` |
| **Taler Exchange** | `.deb` package from GNU Taler · deep integration with the bank |
| **Nginx** | Reverse proxy routing `/` → frontend, `/api` → backend, `/bank` → LibEuFin |

Refer to [docs.taler.net/libeufin](https://docs.taler.net/libeufin/) for the bank installation procedure.

### 4. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cd backend
cp .env.example .env
```

Required keys in `backend/.env`:

```env
PORT=5000
JWT_SECRET=<long random string>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
EMAIL_USER=<gmail address>
EMAIL_PASS=<gmail app password>
BANK_BASE_URL=http://localhost:8080
```

The Supabase project credentials are not in the repo for security reasons.

### 5. Start, stop, and monitor the services

Once everything is installed and configured, all services are managed through three bash scripts at the project root:

```bash
chmod +x start_all.sh stop_all.sh status.sh   # first time only

./start_all.sh   # start Nginx, Node backend, LibEuFin, Taler Exchange
./stop_all.sh    # stop all services in the correct order
./status.sh      # check which services are running and on which ports
```

The frontend is served as a static build by Nginx after running `npm run build` inside `frontend/`.

---

## 📖 How to Use the Project

This section walks through the platform exactly as shown in the demo video.

### Step 1 — Register an Account

1. Open [http://s-taler.duckdns.org](http://s-taler.duckdns.org).
2. Click **Register**.
3. Fill in your full name, email, password (≥ 8 characters), and confirm password.
4. Click **Create Account**.

### Step 2 — Verify Your Email

1. Check your inbox for an email from S-Taler with a **6-digit verification code** (valid for 15 minutes).
2. Enter the code on the verification screen.
3. Once verified, a digital wallet is automatically created for you with a `0.00 PS` balance and a unique `wallet_id`.

### Step 3 — Log In

After verification, click **Login**, enter your email and password, and you land on the **Dashboard** — which shows your wallet balance, recent transactions, and quick actions: **Send**, **Receive**, **Scan QR**, **Marketplace**.

### Step 4 — Link Your Bank Account

1. From the dashboard, click **Bank → Connect a Bank Account**.
2. You are redirected to the LibEuFin Bank WebUI.
3. Create a new bank account (or log in to an existing one).
4. Return to S-Taler — your bank account is now linked.

### Step 5 — Deposit (Bank → Wallet)

1. Go to **Wallet → Deposit**.
2. Enter the amount in PS.
3. Confirm. The amount is transferred from your LibEuFin bank account into your S-Taler wallet, and the balance updates instantly.

### Step 6 — Browse the Marketplace & Buy a Product

1. Click **Marketplace** in the top navigation (this is **publicly accessible** without logging in).
2. Browse merchant stores and products.
3. Click a product → **Add to Cart**.
4. Open the cart and click **Checkout**.
5. The product price is deducted from your wallet, and the order is sent to the merchant.
6. For digital products, you get a download link immediately.

### Step 7 — Make a QR Payment

**As the payer (customer):**
1. Click **Scan QR**.
2. Allow camera access.
3. Point the camera at the merchant's QR code.
4. Confirm the amount and pay.

**As the receiver (merchant):**
1. Open the merchant dashboard → **Generate QR**.
2. Enter the amount to charge.
3. Show the generated QR code to the customer.

### Step 8 — Send Money to Another User (Wallet-to-Wallet)

1. Click **Send Money**.
2. Enter the recipient's wallet ID or email.
3. Enter the amount and an optional note.
4. Click **Send**. The transfer is instant.

### Step 9 — Withdraw (Wallet → Bank)

1. Go to **Wallet → Withdraw**.
2. Enter the amount.
3. Confirm. The amount moves from your S-Taler wallet back to your LibEuFin bank account.

### 🏪 Using the Merchant Role

A user registered as a **Merchant** can:
- **Create a store** — give it a name, logo, and description.
- **Add products** — upload images, set prices, mark as digital or physical.
- **Manage orders** — view incoming orders, mark them as shipped, communicate with buyers through in-app chat.
- **Generate QR codes** — create QR codes for in-person payment.

### 💵 Using the Exchange Role

The **Exchange** role is the key feature for onboarding **unbanked users** into the digital economy.

1. A customer hands you physical cash in person.
2. You open your **Exchange Dashboard → Transfer to Customer**.
3. You enter the customer's wallet ID and the amount.
4. The equivalent is transferred from your exchange wallet to the customer's wallet — instantly.

### Using the Admin Role

Admins (created only by Super Admins) can:
- View platform statistics — total users, transactions, active stores.
- Manage users — suspend, verify, delete.
- Manage stores — approve, ban.
- Configure system settings — fees, transaction limits.
- Create additional admin accounts.

---

## 





 Team

| Name | Student ID |
|---|---|
| Yanal Abu Lawi | 12217175 |
| Amal Hussein | 12219096 |
| Islam Polad | 12219957 |

**Supervisor:** Ms. Khitam Qadri
**Course:** Software Engineering — An-Najah National University, Faculty of Information Technology & Artificial Intelligence
**Date:** May 2026
