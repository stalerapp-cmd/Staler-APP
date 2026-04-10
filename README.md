# S-Taler — Digital Payment Platform

## 🌐 Live Demo

The application is fully deployed on AWS and accessible right now:

| Service | Link |
|---|---|
| **S-Taler App** | [http://s-taler.duckdns.org](http://s-taler.duckdns.org) |
| **LibEuFin Bank WebUI** | [http://s-taler.duckdns.org/bank/webui/#/](http://s-taler.duckdns.org/bank/webui/#/) |

You can register a new account and explore the full platform.  
The merchant store is publicly visible — no account needed to browse products.

---

## 📌 Important — This Project Cannot Be Run Locally with `git clone`

This is **not** a standard web application that starts with `npm install && npm start`.

S-Taler depends on a complex stack of services that require specific system-level setup:

- **LibEuFin Bank** — a Java-based core banking system from the GNU Taler ecosystem. It requires OpenJDK 21, a dedicated PostgreSQL database, system users (`libeufin-bank`), custom `.deb` packages, and a specific configuration file (`bank.conf`). It cannot be installed via npm or pip.
- **Taler Exchange** — a cryptographic exchange service that also requires GNU Taler `.deb` packages, system users, and deep configuration tied to the bank.
- **pgBouncer** — a PostgreSQL connection pooler with custom `pgbouncer.ini` config.
- **Supabase** — the managed cloud database. The project connects to a specific Supabase project on AWS. Without the correct credentials, no data will load.
- **Environment variables** — the `.env` file contains secrets, API keys, and URLs specific to the deployed instance. Without it, nothing works.

Running this project locally requires reproducing the entire AWS EC2 environment, which was done via custom migration scripts — not a simple clone.

---

## 🏗️ Architecture

```
Users / Browser
      ↓
   Nginx (reverse proxy — port 80)
      ↓
  ┌───────────────────────────────────┐
  │  React Frontend (built static)    │
  │  Node.js Backend (port 5000)      │
  │  LibEuFin Bank (port 8080)        │
  │  Taler Exchange (port 8081)       │
  │  pgBouncer (port 6432)            │
  └───────────────────────────────────┘
      ↓
  Supabase (managed PostgreSQL — AWS ap-northeast-2)
```

**Hosted on:** AWS EC2 (m7i-flex.large, Ubuntu 24.04, us-east-1)  
**Domain:** s-taler.duckdns.org (via DuckDNS + Elastic IP)  
**Database:** Supabase — all application and bank data on managed cloud PostgreSQL

---

## 🏦 About the Bank — LibEuFin

The "bank" in S-Taler is not a simulation. It is **LibEuFin**, the official GNU Taler bank implementation — a real core banking system written in Java that manages actual bank accounts, balances, and wire transfers.

Each S-Taler user has two layers:
1. **An S-Taler wallet** — their digital balance inside the app
2. **A LibEuFin bank account** — a real bank account in the GNU Taler banking system

Users can **deposit**: move money from their LibEuFin bank account into their S-Taler wallet  
Users can **withdraw**: move money from their S-Taler wallet back to their LibEuFin bank account

The bank is accessible directly at: [http://s-taler.duckdns.org/bank/webui/#/](http://s-taler.duckdns.org/bank/webui/#/)

---

## 👤 User Roles

| Role | Description |
|---|---|
| **Admin** | Full system control — manages users, stores, system settings, creates other admins |
| **Merchant** | Creates a store, adds products, manages orders, generates QR codes for payment |
| **Exchange** | Acts as a local money exchanger inside the app — accepts cash in person and transfers the equivalent digitally to a user's wallet |
| **Regular User** | Has a digital wallet, links a bank account, pays merchants via QR or manual amount, transfers wallet-to-wallet |

---

## ✨ Features

- Registration & login with email notification
- Digital wallet (PS — Palestinian Shekel)
- Merchant stores — publicly visible without an account
- QR code payments
- Wallet-to-wallet transfers
- Bank withdrawal & deposit (via LibEuFin)
- In-app messaging (chat)
- Admin dashboard
- Arabic & English interface

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Backend | Node.js, Express |
| Database | PostgreSQL via Supabase (cloud managed) |
| Bank | LibEuFin (GNU Taler — Java) |
| Exchange | Taler Exchange |
| Proxy | Nginx |
| Connection Pooler | pgBouncer |
| Cloud | AWS EC2 (us-east-1) |
| Email | Gmail SMTP |

---

## ☁️ Cloud Migration

This project was migrated from a local VirtualBox/Ubuntu machine to AWS 

## 🔗 Links

- **Live App:** [http://s-taler.duckdns.org](http://s-taler.duckdns.org)
- **Bank WebUI:** [http://s-taler.duckdns.org/bank/webui/#/](http://s-taler.duckdns.org/bank/webui/#/)
- **GNU Taler:** [https://taler.net](https://taler.net)
- **LibEuFin Docs:** [https://docs.taler.net/libeufin/](https://docs.taler.net/libeufin/)

---


yanal abu lawi
An-Najah National University 