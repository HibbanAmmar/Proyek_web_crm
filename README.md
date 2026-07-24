# ReviewPulse

**App Review Analytics Dashboard** — scrape, analyze, and understand what users are really saying about your app across the App Store.

![ReviewPulse Dashboard](src/Image/GambarReadme.png)

&gt; ⚠️ **Status: Testing / Beta.** This project is still in active development. Some parts (especially scraping and prediction models) may still change. See the [Known Limitations](#known-limitations) section before using for production needs.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How to Install & Run](#how-to-install--run)
- [How to Use](#how-to-use)
- [How Data Works](#how-data-works)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Features

### 📊 Overview
Main dashboard: average rating, total reviews, sentiment score, active reviewers (each with trends compared to the previous period), daily rating & sentiment trend charts, user segment breakdown, complaint topic breakdown, active alerts, latest reviews, automatic summary ("AI Summary" based on templates), and data export (CSV/JSON/Full Report).

### 📝 Reviews
List of all reviews with filter by rating, sentiment, topic (Gameplay/UI-UX/Bugs/Performance/Monetization/Support — detected from keywords in the text), search, and pagination ("Show More").

### 👥 Segments
Automatic user segmentation based on **rating + review text length**:

| Segment | Criteria |
|---|---|
| Vocal Promoters | Rating ≥4, long text (≥80 characters) |
| Quiet Promoters | Rating ≥4, short text |
| Neutral Reviewers | Rating 3 |
| Vocal Detractors | Rating ≤2, long text |
| Quiet Detractors | Rating ≤2, short text |

Can be displayed as a donut chart or stacked bar chart (toggle), complete with detail table, up/down trend, and pop-up to view original reviews per segment.

### 🔮 Predictions
Forecast rating for 7/30/90 days ahead (linear regression over the last 30 days of historical ratings), complete with confidence interval and risk level. "Key Events" are automatically detected from significant daily rating spikes.

### 🔔 Alerts
Automatic notifications: significant rating drop, spike in negative reviews, spike in bug/crash complaints — all calculated from simple rules over review data, not an external alerting system.

### 🔐 Login
Login page (currently still mock/simulation, not yet connected to a real authentication system).

---

## Tech Stack

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS
- React Router (routing & query params)
- Recharts (all charts)
- lucide-react (icons)
- date-fns (date formatting)

**Backend (scraper)**
- Python + FastAPI
- Playwright (renders the App Store page directly, because Apple's official RSS reviews are no longer reliable)
- deep-translator (optional, auto-translates reviews to English)

**Data storage**
- Browser `localStorage` — no separate database.

---

## Project Structure
