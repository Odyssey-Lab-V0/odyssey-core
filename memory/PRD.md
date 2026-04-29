# Kindred Wealth Studio — PRD

## Original Problem Statement
> "build me react application for wealth and asset management react framework should be very light"

## User Choices (gathered)
- Scope: **Frontend-only** demo with mock data
- Features: Portfolio dashboard, Asset CRUD, Transactions log, Performance analytics, Goals & planning
- Live market data: No (manual entry; static seed prices)
- Auth: JWT email/password (mocked in localStorage)
- Design: defaults — design agent produced "Old Money Tech" (Forest Green + Terracotta on Bone White)

## Architecture
- **React 19** + React Router 7 + Tailwind + Shadcn UI components (Dialog, Select, DropdownMenu, Sonner)
- **Recharts** for all data visualizations
- **@phosphor-icons/react** for iconography
- **Auth**: `AuthProvider` context backed by `localStorage` (`wm_users`, `wm_session`); fake JWT structure
- **Data**: per-user keyed `localStorage` store (`wm_assets_<uid>`, `wm_txs_<uid>`, `wm_goals_<uid>`); `initUserData` seeds first-time users
- Routes:
  - `/login`, `/signup` (PublicOnly)
  - `/dashboard`, `/assets`, `/transactions`, `/analytics`, `/goals` (ProtectedRoute + AppLayout)

## User Personas
- **Solo investor** tracking diversified holdings (stocks, bonds, real estate, crypto, cash)
- **Family wealth lead** monitoring net worth, allocation, and long-horizon goals
- **Advisor demo** showcasing portfolio review with clients

## Core Requirements (Static)
1. Authenticate users (signup/login/logout) with persistent session
2. Per-user portfolio data isolated in localStorage
3. Dashboard with KPIs, performance chart, allocation, top holdings, recent activity
4. Full CRUD for assets, transactions, goals
5. Analytics with portfolio-vs-benchmark line chart, gain/loss per asset, allocation, winners/losers
6. Responsive layout with collapsible mobile sidebar
7. Premium "Old Money Tech" aesthetic — distinctive, not generic fintech

## Implementation Status — 2026-04-29
- ✅ AuthProvider + JWT-mock auth (signup/login/logout)
- ✅ Sidebar layout with NavLink active states + user dropdown
- ✅ Dashboard (4 KPI cards, area chart with benchmark, donut allocation, top holdings, recent tx)
- ✅ Assets page (search, type filter, add/edit/delete dialog, summary cards)
- ✅ Transactions page (buy/sell record, filter tabs, summary cards, qty-adjusts-asset)
- ✅ Analytics page (12M line chart vs benchmark, contribution bar chart, allocation bars, winners/losers)
- ✅ Goals page (create/edit/delete, progress bars, deadline countdown)
- ✅ Per-user localStorage seed data (7 assets, 10 txs, 3 goals)
- ✅ data-testid coverage on all interactive elements
- ✅ Testing agent: 10/10 critical flows pass

## Backlog
### P1
- Persist edits with toast undo
- Asset detail drilldown with per-asset transaction history
- CSV import/export (assets + transactions)
- Currency selector (USD/EUR/GBP) with FX rates
- Optional CoinGecko/Alpha Vantage live price refresh

### P2
- Account & profile settings page (display name, theme)
- Goal contributions: link a goal to a savings asset
- Tax lot tracking (FIFO/LIFO) for realized P/L
- Risk score / volatility analytics
- Multi-account portfolios (taxable, IRA, 401k buckets)
- Light/dark theme toggle with custom dark palette
- Backend migration: FastAPI + MongoDB to persist data server-side
- Real authentication (Emergent Google login or proper JWT API)

## Next Tasks
1. (Optional) Add min-height/aspect to Recharts wrappers to silence dev warnings.
2. Decide on backend persistence vs. continuing as offline-first PWA.
3. Add CSV export — common ask for wealth tools.
