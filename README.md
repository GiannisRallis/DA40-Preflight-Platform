# ✈ DA40 Preflight Platform v6.5

> **Digital Weight & Balance + Performance Calculator for Diamond DA-40 D flight schools.**  
> Self-hosted · Bilingual (EL/EN) · POH §6.4.3 compliant · Docker Compose

![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square&color=2563eb)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-v7-007FFF?style=flat-square&logo=mui&logoColor=white)
![WCAG](https://img.shields.io/badge/WCAG-2.1%20AA-00B4D8?style=flat-square)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/giannisrallis)

---

## 📸 Screenshots

```
┌─────────────────────────────────────────────────────────────────┐
│  ✈ DA40 Platform           [EL] [EN]         Γ. Ράλλης  Έξοδος │
├─────────────────────────────────────────────────────────────────┤
│  [Preflight Calculator]  [Ιστορικό (12)]                        │
│                                                                  │
│  [W&B — Βάρος & Ισορροπία]  [Επιδόσεις & Καύσιμα]             │
│                                                                  │
│  # │ Item              │ Arm  │ Mass  │ Moment │ lb   │ in·lb   │
│  1 │ Empty mass        │ 2.476│ 735.0 │ 1819.9 │ 1620 │ 71,624  │
│  2 │ Front seats       │ 2.300│ 160.0 │  368.0 │  353 │ 14,497  │
│  5 │ TOTAL empty fuel  │  —   │ 895.0 │ 2187.9 │ 1974 │ 86,121  │ ◄──┐
│  7 │ TOTAL full fuel   │  —   │ 994.0 │ 2463.6 │ 2191 │ 96,978  │    │
│                                                                  │    │
│  ✓ ΕΝΤΟΣ ΟΡΊΩΝ · CG R7: 2.479 m · Fwd: 2.441 m                │    │
│                                                                  │    │
│  [CG ENVELOPE DIAGRAM 6.4.4] ← Live SVG, plots dots here ───────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **W&B Calculator** | Full 7-row table per POH §6.4.3 — arms, masses, moments in kg/m **and** lb/in |
| **Live CG Envelope** | SVG diagram plots Row 5 & Row 7 against the POH 6.4.4 forward/rear limits |
| **Performance Calculator** | T/O roll, T/O over 50ft, LDG roll, ROC, density altitude — interpolated from digitized POH charts |
| **Surface & Wind Corrections** | Asphalt/grass factors + headwind/tailwind adjustment |
| **V-Speeds Reference** | vR, initial climb and approach speed per take-off mass bracket |
| **Instructor Dashboard** | View all student submissions, filter, click → full detail modal, add review notes |
| **Analytics** | CG histogram, pass rates, common errors, student rankings |
| **PDF Export** | One-click A4 PDF with W&B table + performance section + disclaimer |
| **Bilingual** | Greek / English toggle — persists via `localStorage` |
| **Self-Hosted** | Docker Compose — runs on any Linux server or Windows with Docker Desktop |
| **JWT Auth** | GoTrue authentication — students only see their own data (Row Level Security) |
| **Backup Scripts** | `backup.ps1` / `backup.sh` — gzip SQL dumps, auto-rotate last 30 |

---

## 🏗️ Architecture

```
Browser
  │
  ▼ :80 / :443
Nginx ────── /api/auth/v1/*  ──►  GoTrue:9999    (JWT authentication)
      ────── /api/rest/v1/*  ──►  PostgREST:3000  (auto REST from PostgreSQL)
      ────── /*              ──►  Next.js:3000     (React frontend)
                                        │
                                  postgres:5432
                                  (roles, tables, RLS)
```

### Services

| Container | Image | Purpose |
|-----------|-------|---------|
| `da40_postgres` | `postgres:15-alpine` | Database with explicit role init scripts |
| `da40_gotrue` | `supabase/gotrue:v2.132.3` | JWT authentication |
| `da40_postgrest` | `postgrest/postgrest:v12.0.2` | Auto REST API from PostgreSQL |
| `da40_nextjs` | `da40platform-nextjs` (built locally) | React frontend + PDF export |
| `da40_nginx` | `nginx:1.25-alpine` | Reverse proxy + CORS + rate limiting |

---

## 🚀 Quick Start

### Requirements

- **Docker Desktop** (Windows) or **Docker + Docker Compose** (Linux/Mac)
- **Git**
- 2 GB RAM, 10 GB disk

### Windows (PowerShell)

```powershell
git clone https://github.com/GiannisRallis/DA40-Preflight-Platform.git
cd da40-platform

Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\Setup.ps1
```

### Linux / Mac

```bash
git clone https://github.com/GiannisRallis/DA40-Preflight-Platform.git
cd da40-platform
bash scripts/setup.sh
```

The setup script:
1. Checks Docker is running
2. Generates alphanumeric secrets (safe for Docker Compose `.env`)
3. Creates a self-signed SSL certificate
4. Builds the Next.js Docker image
5. Starts all services
6. Waits for healthy status

### After setup

```powershell
# 1. Open http://localhost/auth/register
# 2. Create your account
# 3. Promote yourself to instructor:
.\scripts\set-instructor.ps1 -Email info@johnrallis.gr
```

---

## 📁 Project Structure

```
da40-platform/
├── docker-compose.yml          # All 5 services — no Kong, no YAML anchors
├── .env.example                # Copy to .env, fill in secrets
│
├── postgres/
│   └── init/
│       ├── 00_roles.sh         # Creates authenticator, supabase_auth_admin etc.
│       ├── 01_schema.sql       # Tables, indexes, grants, RLS enable, triggers
│       └── 02_ensure_schema.sql# RLS policies (runs after GoTrue creates auth.uid())
│
├── nginx/
│   └── nginx.conf              # Routes /api/auth/v1 → GoTrue, /api/rest/v1 → PostgREST
│
├── nextjs/
│   ├── Dockerfile              # Multi-stage build, standalone output
│   ├── package.json            # Next.js 14, jsPDF, html2canvas, Supabase
│   └── src/
│       ├── app/
│       │   ├── auth/           # login, register pages
│       │   └── dashboard/
│       │       ├── student/    # Preflight calculator + history
│       │       └── instructor/ # Submissions, students, analytics
│       └── lib/
│           ├── i18n/           # el.ts, en.ts, index.tsx (React Context)
│           ├── pdf-export.ts   # jsPDF A4 export
│           └── supabase/       # client.ts, server.ts
│
└── scripts/
    ├── Setup.ps1               # Windows one-command setup
    ├── setup.sh                # Linux/Mac one-command setup
    ├── set-instructor.ps1/.sh  # Promote user to instructor
    └── backup.ps1/.sh          # Database backup
```

---

## 🗄️ Database Schema

### `public.profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | = `auth.users.id` |
| `email` | TEXT | Unique |
| `full_name` | TEXT | |
| `role` | TEXT | `student` \| `instructor` |
| `school_name` | TEXT | |
| `license_num` | TEXT | SPL number |

### `public.submissions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | → `profiles.id` |
| `status` | TEXT | `draft` → `submitted` → `reviewed` |
| `aircraft_reg` | TEXT | e.g. `SX-AEX` |
| `empty_mass_kg` | NUMERIC | From M&B Report |
| `empty_arm_m` | NUMERIC | From M&B Report |
| `front_seats_kg` | NUMERIC | Arm: 2.300 m |
| `rear_seats_kg` | NUMERIC | Arm: 3.250 m |
| `baggage_kg` | NUMERIC | Arm: 3.650 m |
| `fuel_mass_kg` | NUMERIC | Arm: 2.630 m |
| `total_mass_r5/r7` | NUMERIC | Calculated |
| `cg_r5/r7` | NUMERIC | Calculated (m) |
| `wb_status` | TEXT | `ok` \| `out_of_limits` \| `check_range` |
| `to_roll_m` | NUMERIC | Interpolated from POH |
| `instructor_notes` | TEXT | Set by instructor |

### Row Level Security

- **Students** — full access to own `submissions`, read-only own `profile`
- **Instructors** — read all `submissions`, read all `profiles`, update `submissions`
- Uses `SECURITY DEFINER` function `is_instructor()` to avoid RLS circular dependency

---

## ✈ POH Data

All calculations use digitized data from the **Diamond DA-40 D Pilot's Operating Handbook**:

### Weight & Balance (§6.4.3)

| Arm | Value |
|-----|-------|
| Front seats | 2.300 m (90.6 in) |
| Rear seats | 3.250 m (128.0 in) |
| Baggage | 3.650 m (143.7 in) |
| Fuel (0.84 kg/L) | 2.630 m (103.5 in) |

### CG Limits (Diagram 6.4.4)

- **Forward limit:** 2.400 m (780–980 kg), linear to 2.460 m (980–1150 kg)
- **Rear limit:** 2.590 m (all masses)
- **Mass range:** 780–1150 kg

### Performance Correction Factors

| Surface | Factor |
|---------|--------|
| Asphalt/concrete | ×1.00 |
| Grass ≤5 cm | ×1.10 |
| Grass 5–10 cm | ×1.15 |
| Grass >10 cm | ×1.25 |

---

## 🔧 Useful Commands

```bash
# Status
docker compose ps

# Live logs
docker compose logs -f

# Specific service
docker compose logs -f gotrue
docker compose logs -f postgrest

# Backup database
.\scripts\backup.ps1              # Windows
bash scripts/backup.sh            # Linux

# Full reset (WARNING: deletes all data)
docker compose down -v
docker compose up -d

# Add a column (example — no reset needed)
docker compose exec -T postgres psql -U postgres -d postgres -c \
  "ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS new_col TEXT;"

# Rebuild only Next.js (no DB reset)
docker compose build --no-cache nextjs
docker compose up -d nextjs
```

---

## 🔐 Security Notes

- All passwords in `.env` must be **alphanumeric only** (`a-zA-Z0-9`) — Docker Compose does not shell-escape `.env` values
- Never commit `.env` to git (it's in `.gitignore`)
- JWT tokens expire after 1 hour
- Rate limiting via Nginx: 20 req/min on auth endpoints, 120 req/min on API
- PostgREST connects as `authenticator` role with limited permissions
- All tables have RLS enabled — no data leaks between students

---

## 🤝 Contributing

Pull requests welcome. For major changes, open an issue first.

```bash
git checkout -b feature/aircraft-library
# make changes
git commit -m "feat: add per-aircraft M&B library"
git push origin feature/aircraft-library
# open PR
```

### Roadmap

- [ ] Aircraft M&B library (per-registration empty mass/arm)
- [ ] Email notifications on submission
- [ ] Minimum flight hours tracker
- [ ] Multi-school / multi-tenant isolation
- [ ] Let's Encrypt auto-renewal
- [ ] Mobile-optimized form

---

## 📄 License

MIT — free to use, modify and redistribute. Commercial school use requires a [school license](mailto:info@johnrallis.gr).

---

<div align="center">

**Built for Greek flight schools · Powered by open source**

[🌐 Website](https://johnrallis.gr) · [📧 Contact](mailto:info@johnrallis.gr) · [⭐ Star on GitHub](https://github.com/GiannisRallis/DA40-Preflight-Platform.git)

<br/>

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/giannisrallis)

</div>
