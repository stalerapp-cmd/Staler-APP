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

This tutorial will guide you through the usage of the platform as seen in the demo video.

## Step 1: Create an Account and Verify It

1. Go to [http://s-taler.duckdns.org](http://s-taler.duckdns.org) and click **Register**.

2. Select whether you are a **Regular User**, **Merchant**, or **Exchange**, then fill in your full name, email address, and password (at least 8 characters long and adhering to the security standards). A `wallet_id` is automatically assigned to your account.

3. Find the **Verification Code** sent to your email (a 6-digit code that expires after 15 minutes), then input it into the verification page.

4. Once your account is verified, your digital wallet will be instantly set up with a balance of `0.00 PS`. Now you can log in and access your Dashboard (balance, recent transactions, and fast access options: Send, Receive, Scan QR, Marketplace).

## Step 2 – Connect a Bank Account

From the dashboard, select **Bank → Connect a Bank Account**, and the page will redirect you to the LibEuFin Bank WebUI. Create a new account there (or login to an existing account), then head back to S-Taler – that’s it, your bank account is connected.

> **Note:** Once a bank account is linked to your profile, it **cannot** be changed without contacting support.

## Step 3 – Deposit/Withdraw (Bank ↔ Wallet)

To perform any operation, a connected bank account is necessary.

- **Deposit (Bank → Wallet):** Visit **Wallet → Deposit**. Enter the required sum in PS, and press **OK** to send your money from your LibEuFin bank account to your S-Taler wallet.

- **Withdraw (Wallet → Bank):** Visit **Wallet → Withdraw**. Enter the sum to be withdrawn, and press **OK** to get money back to your bank account.

## Step 4 – Transfer Funds to Another Wallet

Click **Send Money** button at the bottom, input the wallet address of your receiver, the required sum, and add a comment if needed, and finally, press **Send**.

## Step 5 — QR Payments

Each user (excluding Admin) is issued with a unique QR code that can be used to request payments.

- **When making payments:** Click on **Scan QR**, grant access to use the camera, scan the QR code, and confirm payment.

- **When receiving payments:** Go to merchant's dashboard → click **Generate QR**, specify amount, and show it to the buyer.

## Step 6 — Explore Marketplace & Make Purchase

The marketplace can be **accessed by anyone**; users can browse all stores and learn about their products without signing in, although to make purchases, a user must have an account.

1. Go to **Marketplace**, browse merchants, choose a product, and **Add it to Cart**.

2. Proceed to **Cart**, press **Proceed** to make payment from the wallet.

3. If it is a digital item, then you will get the link immediately; if it is physical goods, then it is sent to the merchant.

## Step 7 – Account Settings and In-App Messaging

From the account settings page, the user can update their profile picture, password, email address, and username. An email alert will be sent whenever there are any changes to the security-sensitive information.The user can communicate directly with any other user within the application.


---
# User Roles

## Regular User

Wallet, transfers, QR payments, shopping via Marketplace, in-app chats.

## Merchant

Merchant has a web store and does the following things:

- **Sets up the store** — name, logo, description.

- **Adds, edits, deletes** products — digital or physical items, sets prices and availability (in/out of stock indicator).

- **Orders management** — each order goes through **Pending → Processing → Completed → Canceled** states. The merchant gets paid only when the order is marked as **Completed**, whereas canceled orders get automatically refunded to the user.

- **Creates a merchant's QR** code, which has a different payment amount.

- Can look through other merchants' stores, do transfers, deposit or withdraw money, and view their store.

## Exchange

The most important functionality provided for unbanked users, who are onboarded with an Exchange role, which allows:

- **To scan QR code of the customer** to identify him/her.

- **To send wallet money** to the customer in exchange for cash transferred physically during the transaction.

- **Deposits** and withdrawals between exchange wallet and bank account.

## Admin (Regular)

- Looks through platform statistics, pending users, and settings.

- Manages all users — edits, deletes, filters by roles.

- Manages stores — editing, deleting.

## Super Admin

Possesses all Regular Admin privileges, with the additional capability of **Creating New Admins, Super Admins, and Users**.

## Bank Administrator (LibEuFin)

Controls the underlying LibEuFin bank — creating new bank accounts, changing passwords, and managing all banking accounts.

## Bank Exchange (LibEuFin)

Deals with financial transactions between wallets and banks on the banking level — wallet transactions, interbank transactions, and complete transaction history.
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
