# S-Taler — Digital Payment Platform

A secure, bilingual (Arabic & English) digital payment platform built for the Palestinian market. Combines a digital wallet, an e-commerce marketplace, QR-code payments, wallet-to-wallet transfers, and a real banking layer (LibEuFin / GNU Taler) — all integrated into one web application.

**Live application:** [http://s-taler.duckdns.org](http://s-taler.duckdns.org)
**Bank WebUI:** [http://s-taler.duckdns.org/bank/webui/#/](http://s-taler.duckdns.org/bank/webui/#/)

---


## Demo Video

[![S-Taler Demo](https://img.youtube.com/vi/6_f7TY62vM0/maxresdefault.jpg)](https://youtu.be/6_f7TY62vM0)

>  **[Watch the full demo on YouTube](https://youtu.be/6_f7TY62vM0)**

## Tools & Technologies

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

<img width="962" height="1184" alt="aws2 drawio (1)" src="https://github.com/user-attachments/assets/dc903021-ff1e-4941-9a62-cd1c8b58e612" />

---

## How to Run the Project

>  **S-Taler is not your usual `git clone && npm install && npm start` project.**
>
> The stack requires system-level services that **cannot be simply installed locally**:
>
> - **LibEuFin Bank** — a Java service provided by GNU Taler, which needs OpenJDK 21, `.deb`-specific builds, a dedicated database, system users (`libeufin-bank`), and its `bank.conf`. It cannot be installed using `npm` or `pip`.
> - **Taler Exchange** — similarly, also deeply integrated with the bank.
> - **Supabase Credentials** — the `.env` file containing all API keys and URLs is **not** included in the repo.
>
> Therefore, **the best way to try out this project is by running the live app:**
>
> **[http://s-taler.duckdns.org](http://s-taler.duckdns.org)**
>
> Create your free account and test the complete system at once! The merchant marketplace is accessible publicly without the need for registration.

Below, one can see a brief guide that would show how a developer could replicate the deployment process themselves on a Linux machine.

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

Required keys in `backend/.env` (see `backend/.env.example` for the full list):

```env
# Server
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost

# Supabase
SUPABASE_URL=<your supabase url>
SUPABASE_SECRET_KEY=<your supabase secret key>
SUPABASE_ANON_KEY=<your supabase anon key>

# JWT
JWT_SECRET=<long random string, min 32 chars>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# LibEuFin Bank
LIBEUFIN_BANK_URL=http://localhost:8080
BANK_ADMIN_USERNAME=admin
BANK_ADMIN_PASSWORD=<bank admin password>
BANK_EXCHANGE_USERNAME=exchange
BANK_EXCHANGE_PASSWORD=<exchange password>

# Taler Exchange
TALER_EXCHANGE_URL=<your exchange url>
TALER_CURRENCY=PS

# Transaction Limits
MAX_DEPOSIT=10000
MAX_WITHDRAWAL=10000
ALLOW_OVERDRAFT=false

# Email (Gmail SMTP)
EMAIL_USER=<your gmail address>
EMAIL_PASSWORD=<gmail app password>

# Encryption
ENCRYPTION_KEY=<32-character encryption key>
MESSAGE_ENCRYPTION_KEY=<message encryption key>
```

The Supabase credentials and bank passwords are not in the repo for security reasons.

### 5. Start, stop, and monitor the services

Once everything is installed and configured, all services are managed through three bash scripts at the project root:

```bash
chmod +x start-all.sh stop-all.sh status.sh restart-all.sh   # first time only

./start-all.sh    # start Nginx, Node backend, LibEuFin, Taler Exchange
./stop-all.sh     # stop all services in the correct order
./restart-all.sh  # restart everything (useful after config changes)
./status.sh       # check which services are running and on which ports
```

The frontend is served as a static build by Nginx after running `npm run build` inside `frontend/`.

---

## How to Use the Project

This section walks through the platform exactly as shown in the demo video.

### Step 1 - Registering

1. Visit the website at [http://s-taler.duckdns.org](http://s-taler.duckdns.org).
2. Tap on **Register**.
3. Provide your full name, email address, password (at least 8 characters long), and retype your password.
4. Tap on **Create Account**.

### Step 2 – Verifying your Email Address

1. Go through your email and retrieve an email from S-Taler with **6-digit code** (valid only for 15 minutes).
2. Enter the code in the designated area.
3. After successful verification, an online wallet is instantly set up with a balance of `0.00 PS` and your own `wallet_id`.

### Step 3 – Logging in

Once your account gets successfully verified, tap **Login**, enter your email address and password, and access the **Dashboard** where you'll see your wallet balance, recent transactions, and other quick options such as **Send**, **Receive**, **Scan QR Code** and **Marketplace**.

### Step 4 – Linking a Bank Account

1. Navigate to the dashboard, and click on **Bank → Connect a Bank Account**.
2. The webpage redirects you to the LibEuFin Bank WebUI.
3. Set up a new bank account (or login into an existing account).
4. Go back to S-Taler website.

### Step 5 — Deposit (Bank → Wallet)

1. Go to **Wallet → Deposit**.
2. Specify the sum in PS.
3. Confirm the transaction; the sum will be transferred from your LibEuFin bank account to your S-Taler wallet and credited instantly.

### Step 6 — Browsing the Marketplace and Buying Products

1. Navigate to **Marketplace** on the website (this section can be accessed **without logging in**).
2. Look through the various merchant stores and their offerings.
3. Select any product → **Add to Cart**.
4. Go to cart and click **Proceed**.
5. Pay for the product using funds from your wallet; after which, your order will be sent to the merchant.
6. In case of a digital product, you will receive the download link instantly.

### Step 7 – Do a QR Payment

**As the payer (the customer):**
1. Tap on **Scan QR**.
2. Grant permission to use the camera.
3. Scan the QR code provided by the merchant.
4. Pay.

**As the receiver (the merchant):**
1. Go to the merchant's dashboard → **Generate QR**.
2. Input the amount you want to charge.
3. Present the QR code to the customer.

### Step 8 – Transfer Money to another person's Wallet (wallet to wallet)

1. Click **Send Money**.
2. Input the ID or email address of the person.
3. Input the amount and add a note (optional).
4. Tap **Send**. The transfer happens immediately.

### Step 9 – Withdraw Funds (Wallet → Bank)

1. Select **Wallet → Withdraw**.
2. Input the amount.
3. Click Confirm. This will withdraw the funds from your S-Taler wallet back to your LibEuFin bank account.

### Using the Merchant Role

A user registered as a **Merchant** can:
- **Create a store** — give it a name, logo, and description.
- **Add products** — upload images, set prices, mark as digital or physical.
- **Manage orders** — view incoming orders, mark them as shipped, communicate with buyers through in-app chat.
- **Generate QR codes** — create QR codes for in-person payment.

### Using the Exchange Role

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

## Team

| Name | Student ID |
|---|---|
| Yanal Abu Lawi | 12217175 |
| Amal Hussein | 12219096 |
| Islam Polad | 12219957 |

**Supervisor:** Ms. Khitam Qadri
**Course:** Software Engineering — An-Najah National University, Faculty of Information Technology & Artificial Intelligence
**Date:** May 2026
