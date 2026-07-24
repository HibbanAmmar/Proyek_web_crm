# ReviewPulse

**App Review Analytics Dashboard** — scrape, analyze, and understand what users are really saying about your app across the App Store.

![ReviewPulse Dashboard](src/Image/GambarReadme.png)

> ⚠️ **Status: Testing / Beta.** This project is still under active development. Some parts (especially the scraping process and prediction model) may change over time. Please read the [Known Limitations](#known-limitations) section before using it in production.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Running](#installation--running)
- [Usage](#usage)
- [How the Data Works](#how-the-data-works)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Features

### 📊 Overview

The main dashboard provides average rating, total reviews, sentiment score, active reviewers (each with trend comparison against the previous period), daily rating & sentiment trend charts, user segment breakdown, complaint topic breakdown, active alerts, latest reviews, an automatic summary ("AI Summary" powered by rule-based templates), and data export (CSV/JSON/Full Report).

### 📝 Reviews

Browse all reviews with filters for rating, sentiment, and topic (Gameplay/UI-UX/Bugs/Performance/Monetization/Support — detected using keyword matching), along with search and pagination ("Load More").

### 👥 Segments

Users are automatically segmented based on **rating + review length**:

| Segment | Criteria |
| --- | --- |
| Vocal Promoters | Rating ≥4, long review (≥80 characters) |
| Quiet Promoters | Rating ≥4, short review |
| Neutral Reviewers | Rating = 3 |
| Vocal Detractors | Rating ≤2, long review |
| Quiet Detractors | Rating ≤2, short review |

Segments can be displayed as either a donut chart or a stacked bar chart (toggle), complete with detailed tables, trend indicators, and pop-up dialogs to view the original reviews for each segment.

### 🔮 Predictions

Forecast app ratings for the next 7, 30, and 90 days using linear regression on the last 30 days of historical ratings. Includes confidence intervals and risk levels. Significant daily rating spikes are automatically detected as **Key Events**.

### 🔔 Alerts

Automatic notifications for significant rating drops, spikes in negative reviews, and sudden increases in bug/crash complaints. All alerts are generated using rule-based analysis of review data—no external alerting system is involved.

### 🔐 Login

Login page (currently mocked/simulated and not connected to a real authentication system).

---

## Tech Stack

### Frontend

- React + TypeScript + Vite
- Tailwind CSS
- React Router (routing & query parameters)
- Recharts (all charts)
- lucide-react (icons)
- date-fns (date formatting)

### Backend (Scraper)

- Python + FastAPI
- Playwright (renders App Store pages because Apple's official RSS review feed is no longer reliable)
- deep-translator (optional, automatically translates reviews into Indonesian)

### Data Storage

- Browser `localStorage` — no separate database.

---

## Project Structure

```text
app/
├── src/
│   ├── api/             # API layer — index.ts (all getX functions), types.ts (shared types)
│   ├── backend/         # Python backend (FastAPI + Playwright scraper)
│   ├── components/      # UI components (charts, tables, modals, layout)
│   ├── data/            # Mock data (legacy fallback, mostly unused)
│   ├── hooks/           # Custom hooks (useReviews, useRefresh, use-mobile)
│   ├── Image/           # Static image assets
│   ├── lib/             # Core logic — reviewAnalytics.ts, reviewData.ts, exportUtils.ts
│   ├── pages/           # Pages (OverviewPage, ReviewsPage, SegmentsPage, etc.)
│   ├── types/           # Shared TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Installation & Running

### Prerequisites

- Node.js 18+ and [pnpm](https://pnpm.io/)
- Python 3.9+
- Around 300 MB of free disk space (for downloading Playwright's headless browser)

### 1. Frontend

```bash
cd app
pnpm install
pnpm dev
```

The frontend runs at `http://localhost:5173` (Vite default).

### 2. Backend (Scraper)

```bash
cd app/src/backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install fastapi uvicorn playwright deep-translator pydantic requests
playwright install chromium  # Run once to download the headless browser

python main.py
# or
uvicorn main:app --reload --port 8000
```

The backend runs at **`http://localhost:8000`**. Make sure the backend is running before scraping a new app from the UI.

---

## Usage

1. **Add an app** — Open the sidebar and add the App Store app you want to track using its App ID (a 9–10 digit number found in the App Store URL: `apps.apple.com/id/app/app-name/idXXXXXXXXX`).
2. **Scrape reviews** — Start the scraping process (the backend must be running on `localhost:8000`). Scraped data is automatically stored in your browser's `localStorage`.
3. **Overview** — View a quick summary of ratings, sentiment, trends, user segments, topics, and alerts.
4. **Reviews** — Search and filter reviews while identifying relevant topics.
5. **Segments** — Discover who your Vocal Promoters, Quiet Detractors, and other user groups are. Click a segment to view the original reviews.
6. **Predictions** — Explore future rating forecasts and significant events that may require attention.
7. **Export** — Download review data (CSV/JSON) or a complete report from the Overview page at any time.

---

## How the Data Works

ReviewPulse **does not use a database or backend storage for review data**. Instead, all scraped reviews are stored locally in your browser's `localStorage` using the key `reviewpulse_app_{appId}`.

Every analytics metric—including rating trends, sentiment, user segments, topic detection, forecasts, and more—is **recalculated on the frontend** each time a page is opened using the raw review data. Nothing is cached or stored on a remote server.

As a result:

- Data is **browser-specific**. Opening the app in another browser or device will show no data until reviews are scraped again.
- Clearing browser data or `localStorage` permanently removes all stored reviews.
- Suitable for personal use and testing, **but not yet ideal for teams requiring centralized data storage.**

---

## Known Limitations

Since the project is still in beta, several components are intentionally simplified:

- **This is not a true AI/ML system.** Forecasting, AI Summary, topic detection, and sentiment classification all rely on simple heuristics and rule-based methods (linear regression and keyword matching), not machine learning. They are useful for identifying general trends but should not be considered highly accurate.
- **Limited review volume.** Apple's official RSS review feed is no longer reliable, so the scraper now renders App Store pages directly using Playwright. As a result, significantly fewer reviews can be collected per app compared to the RSS era (typically dozens rather than hundreds).
- **Topic and sentiment detection are keyword-based**, so context such as negation or sarcasm may occasionally be interpreted incorrectly.
- **Login is currently mocked**, with no real authentication implemented.

---

## Troubleshooting

### Scraping always returns 0 reviews

1. Make sure the backend is running (`python main.py`) on `localhost:8000`.
2. Verify that the Playwright browser has been installed (`playwright install chromium`).
3. Try scraping a more popular app to rule out environment-related issues.

### Data disappears after refreshing or switching browsers

This is expected. Data is stored locally in your browser's `localStorage`, not on a server.

### Charts display empty or unexpected values

This usually happens when there aren't enough reviews to calculate certain metrics. For example, trend analysis requires data spanning multiple days.

---

## Roadmap

- [ ] Real authentication (replace the mock login)
- [ ] Centralized backend/database (optional, for team usage)
- [ ] Improve topic detection and sentiment classification accuracy
- [ ] Support additional countries beyond Indonesia and Malaysia

---

<p align="center">Made with ❤️ — continuously improving.</p>
