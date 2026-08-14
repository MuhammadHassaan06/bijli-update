# Bijli Update 🇵🇰 — Crowdsourced Power Outage Reporter

**Bijli Update** is a hyperlocal, crowdsourced power outage and load-shedding reporting web application built for Pakistan. It features a React + Tailwind CSS frontend designed according to the **Crescent Utility System** design spec (`crescent_utility_system/DESIGN.md`) and a Node.js + Express + SQLite REST API backend with rate-limiting, IP hashing, and automated statistics aggregation.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (packaged with Node.js)

### 1. Server Setup & Launch (Node.js + Express + SQLite)
```bash
cd server
npm install
npm run dev # or npm start
```
*The Express server will start on `http://localhost:5000` and automatically seed `bijli.db` with realistic sample reports across Pakistan cities on first launch.*

### 2. Client Setup & Launch (Vite + React + Tailwind)
```bash
cd client
npm install
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

---

## ⚡ Features & Requirements Checklist

- **Stitch Design System Compliance:**
  - Preserves every color token (`primary`, `tertiary`, `surface-container-*`), spacing value (`container-padding`, `stack-lg`), typography scale (`Inter`), and component style (`Status Cards`, `Chips`, `Elevation`).
  - Configured custom tokens directly in `client/tailwind.config.js`.
  - Reuses logo asset from `bijli_update_logo/screen.png`.
  - Bottom navbar (`Home`, `Trending`, `About`) and header bar preserved 1:1.

- **Backend API Endpoints (Express + SQLite):**
  - `POST /api/report`: Validates non-empty `city`, `area`, `status` ("OUTAGE" | "RESTORED"). Hashes IP address via SHA-256 and rate-limits reports to **1 report per IP per area per 5 minutes**.
  - `GET /api/reports?city=&area=&hours=1`: Returns reports from the last N hours (newest first), plus aggregate analysis object `{ outageCount, restoredCount, netStatus }` ("Likely Outage" if outage reports in last 30 min outnumber restored reports 2:1, otherwise "Stable").
  - `GET /api/cities`: Returns list of 10 major Pakistan cities (*Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Hyderabad, Gujranwala*).
  - `GET /api/trending?limit=10`: Returns top reported hotspot areas, `totalReportsToday` count, and distribution percentages (Active, Scheduled, Resolved).

- **Frontend Wiring & Interactivity:**
  - **Home Screen:** Select city & enter area. Action buttons ("Bijli Chali Gayi" / "Bijli Aa Gayi") with tactile active states, loading spinner → success checkmark animation. High alert card and live activity feed populated via auto-refreshing polling (every 30 seconds).
  - **Trending Outages Screen:** Populated from `/api/trending` with live total reports counter, colored proportional status bar, and ranked leaderboard of hotspots with report counts. Map card kept as visual "Coming Soon" placeholder.

---

## 🛠 Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS 3, PostCSS, Material Symbols Outlined.
- **Backend:** Node.js, Express, `better-sqlite3`, `cors`, Node `crypto` (SHA-256).
