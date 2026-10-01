# Flowline ERP — Brightweld Industries

> An enterprise Manufacturing Resource Planning (ERP) web application engineered for Brightweld Industries. Developed as an academic full-stack project.

---

## 🏛 Architecture Overview

Flowline is structured as an integrated full-stack monorepo with side-by-side frontend and backend applications:

```
bwperp/
├── backend/                  # Node.js + Express + PostgreSQL REST API
│   ├── middleware/           # Session authentication & RBAC guards
│   ├── routes/               # API route handlers
│   ├── db.js                 # PostgreSQL connection pool
│   ├── server.js             # Express application entrypoint
│   ├── schema.sql            # Relational database schema
│   ├── seed.js               # Database seeding script
│   ├── package.json          # Backend dependencies
│   └── .env.example          # Backend environment template
├── frontend/                 # React (Vite) Single Page Application
│   ├── src/                  # React components, contexts, and pages
│   ├── index.html            # Space Grotesk, Inter, & IBM Plex Mono fonts
│   ├── vite.config.js        # Vite configuration
│   ├── package.json          # Frontend dependencies
│   └── .env.example          # Frontend environment template
├── README.md                 # Project documentation
└── .gitignore                # Global git ignore rules
```

---

## ⚙️ Tech Stack & Design System

### Backend
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: PostgreSQL
* **Authentication**: Cookie/Session-based auth via `express-session` (HTTP-only, Lax, secure: false for local dev)
* **Authorization**: Granular Role-Based Access Control (RBAC) with database permission mapping (`admin`, `manager`, `staff`)

### Frontend
* **Framework**: React 18 with Vite
* **Routing**: React Router v6
* **Styling**: Plain CSS with strict Design System custom properties:
  * `--ink`: `#12213A` (Dark sidebar & primary headings)
  * `--teal`: `#0E6E6E` (Primary actions & core module accents)
  * `--amber`: `#E8A33D` (Highlights & in-progress states)
  * `--slate`: `#5B6472` (Secondary text & reference accents)
  * `--paper`: `#F6F4EF` (Page background)
  * `--success`: `#2E9E68`
  * `--danger`: `#D64545`
* **Typography**:
  * Headings & Nav: `'Space Grotesk'`
  * Body copy: `'Inter'`
  * Data tokens (SKUs, codes, amounts, timestamps, badges): `'IBM Plex Mono'`

---

## 🚀 Getting Started

### 1. Database Setup (PostgreSQL)

Create a PostgreSQL database (e.g. `bwperp` or `flowline_erp`):
```sql
CREATE DATABASE bwperp;
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` with your local database credentials:
```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bwperp
DB_USER=postgres
DB_PASSWORD=your_postgres_password
SESSION_SECRET=flowline_brightweld_session_secret_2026_academic_prod
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Seed the database with roles, permissions, inventory items, and test users:
```bash
node seed.js
```

Start the backend server on port 4000:
```bash
npm run dev
# or: node server.js
```

### 3. Frontend Setup

In a separate terminal:
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Start the Vite dev server on port 5173:
```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Configured Test Accounts

All accounts share the default seed password: `password123`.

| Role | Email | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `sufiyan@brightweld.com` | `password123` | Full system access + **Users & Roles** security module |
| **Manager** | `dhruv@brightweld.com` | `password123` | Operational access across Sales, Procurement, Inventory, Kanban |
| **Staff** | `twisha@brightweld.com` | `password123` | Shop floor view & order logging (**Users & Roles** hidden, 403 on restricted actions) |

---

## 🔄 End-to-End Business Flow

1. **Create Sales Order**: Initiated under `demand` stage.
2. **Issue Purchase Order**: Linked to the Sales Order &rarr; auto-advances the Sales Order to `procurement`.
3. **Receive Purchase Order**: Marked as `received` &rarr; auto-advances the Sales Order to `production`.
4. **Complete Manufacturing Job**: Advancing job to `done` &rarr; auto-advances the Sales Order to `qc`.
5. **Quality Check & Dispatch**: Order is delivered and realized in revenue analytics.
