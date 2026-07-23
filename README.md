# ReviewPulse

**App Review Analytics Dashboard** — scrape, analyze, and understand what users are really saying about your app across the App Store.

![ReviewPulse Dashboard](src/image/GambarReadme.png)
<!-- Ganti/tambahkan screenshot kamu sendiri di path di atas -->

> ⚠️ **Status: Testing / Beta.** Project ini masih dalam tahap pengembangan aktif. Beberapa bagian (terutama scraping dan model prediksi) masih bisa berubah. Lihat bagian [Known Limitations](#known-limitations) sebelum dipakai untuk kebutuhan production.

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Struktur Project](#struktur-project)
- [Cara Install & Menjalankan](#cara-install--menjalankan)
- [Cara Pakai](#cara-pakai)
- [Bagaimana Data Bekerja](#bagaimana-data-bekerja)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Fitur

### 📊 Overview
Dashboard utama: rata-rata rating, total review, sentiment score, active reviewers (masing-masing dengan tren dibanding periode sebelumnya), grafik tren rating & sentimen harian, breakdown segmen user, breakdown topik keluhan, alert aktif, review terbaru, ringkasan otomatis ("AI Summary" berbasis template), dan export data (CSV/JSON/Full Report).

### 📝 Reviews
Daftar semua review dengan filter rating, sentimen, topik (Gameplay/UI-UX/Bugs/Performance/Monetization/Support — dideteksi dari kata kunci di teks), pencarian, dan pagination ("Tampilkan Selanjutnya").

### 👥 Segments
Segmentasi user otomatis berdasarkan **rating + panjang teks review**:

| Segmen | Kriteria |
|---|---|
| Vocal Promoters | Rating ≥4, teks panjang (≥80 karakter) |
| Quiet Promoters | Rating ≥4, teks pendek |
| Neutral Reviewers | Rating 3 |
| Vocal Detractors | Rating ≤2, teks panjang |
| Quiet Detractors | Rating ≤2, teks pendek |

Bisa ditampilkan sebagai donut chart atau stacked bar chart (toggle), lengkap dengan tabel detail, trend naik/turun, dan pop-up untuk melihat review asli per segmen.

### 🔮 Predictions
Forecast rating 7/30/90 hari ke depan (regresi linear atas rating historis 30 hari terakhir), lengkap dengan confidence interval dan risk level. "Key Events" dideteksi otomatis dari lonjakan rating harian yang signifikan.

### 🔔 Alerts
Notifikasi otomatis: penurunan rating signifikan, lonjakan review negatif, lonjakan keluhan bug/crash — semua dihitung dari aturan sederhana atas data review, bukan sistem alerting eksternal.

### 🔐 Login
Halaman login (saat ini masih mock/simulasi, belum terhubung ke sistem autentikasi sungguhan).

---

## Tech Stack

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS
- React Router (routing & query param)
- Recharts (semua chart)
- lucide-react (icon)
- date-fns (format tanggal)

**Backend (scraper)**
- Python + FastAPI
- Playwright (render halaman App Store, karena RSS review resmi Apple sudah tidak bisa diandalkan)
- deep-translator (opsional, auto-translate review ke Bahasa Indonesia)

**Data storage**
- `localStorage` browser — tidak ada database terpisah.

---

## Struktur Project

```
app/
├── src/
│   ├── api/            # Layer API — index.ts (semua fungsi getX), types.ts (tipe bersama)
│   ├── backend/        # Backend Python (FastAPI + Playwright scraper)
│   ├── components/     # Komponen UI (charts, table, modal, layout)
│   ├── data/            # Data mock (fallback lama, sebagian besar sudah tidak dipakai)
│   ├── hooks/           # Custom hooks (useReviews, useRefresh, use-mobile)
│   ├── Image/           # Aset gambar statis
│   ├── lib/             # Logic inti — reviewAnalytics.ts, reviewData.ts, exportUtils.ts
│   ├── pages/           # Halaman (OverviewPage, ReviewsPage, SegmentsPage, dst)
│   ├── types/           # Tipe TypeScript bersama
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Cara Install & Menjalankan

### Prasyarat
- Node.js 18+ dan [pnpm](https://pnpm.io/)
- Python 3.9+
- ~300MB ruang kosong (buat download browser headless Playwright)

### 1. Frontend

```bash
cd app
pnpm install
pnpm dev
```

Frontend berjalan di `http://localhost:5173` (default Vite).

### 2. Backend (scraper)

```bash
cd app/src/backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install fastapi uvicorn playwright deep-translator pydantic requests
playwright install chromium  # sekali aja, download browser headless

python main.py atau uvicorn main:app --reload --port 8000
```

Backend berjalan di **`http://localhost:8000`**. Pastikan backend jalan dulu sebelum scraping app baru dari UI.

---

## Cara Pakai

1. **Tambah app** — buka sidebar, pilih/tambah app yang mau di-tracking lewat App ID App Store-nya (angka 9-10 digit, bisa dicari di URL App Store: `apps.apple.com/id/app/nama-app/id`**`XXXXXXXXX`**).
2. **Scrape review** — trigger proses scraping (backend harus jalan di `localhost:8000`). Data hasil scrape disimpan otomatis di `localStorage` browser kamu.
3. **Overview** — lihat ringkasan cepat: rating, sentimen, tren, segmen, topik, dan alert.
4. **Reviews** — filter & cari review spesifik, tandai topik yang relevan.
5. **Segments** — lihat siapa aja "Vocal Promoters" vs "Quiet Detractors" dst, klik segmen buat lihat review aslinya.
6. **Predictions** — lihat proyeksi rating ke depan dan hal-hal signifikan yang perlu diwaspadai.
7. **Export** — di Overview, unduh data review (CSV/JSON) atau laporan lengkap kapan aja.

---

## Bagaimana Data Bekerja

ReviewPulse **tidak punya database/server backend untuk data** — semua data review hasil scraping disimpan di `localStorage` browser dengan key `reviewpulse_app_{appId}`. Semua angka analytics (rating trend, sentiment, segmen, topik, forecast, dst) **dihitung ulang di sisi frontend** setiap halaman dibuka, dari data mentah itu — bukan di-cache di server manapun.

Konsekuensinya:
- Data **spesifik per-browser** — buka dari browser/device lain = data kosong sampai scrape ulang.
- Clear browser data / clear localStorage = semua data review hilang.
- Cocok untuk personal use / testing, **belum cocok untuk tim yang perlu data tersentralisasi.**

---

## Known Limitations

Karena ini masih tahap testing, beberapa hal sengaja disederhanakan:

- **Bukan model AI/ML beneran.** Forecast, AI Summary, deteksi topik, dan klasifikasi sentimen semuanya heuristik/aturan sederhana (regresi linear, pencocokan kata kunci) — bukan machine learning. Cukup buat gambaran arah tren, jangan dianggap presisi tinggi.
- **Volume review terbatas.** RSS review resmi Apple sudah tidak bisa diandalkan (sering balikin kosong), jadi scraper sekarang render halaman App Store langsung (Playwright). Konsekuensinya, jumlah review yang bisa diambil per app jauh lebih sedikit dibanding era RSS (puluhan, bukan ratusan).
- **Deteksi topik & sentimen berbasis kata kunci**, bisa salah tangkap konteks (negasi, sarkasme) sesekali.
- **Login masih mock**, belum ada autentikasi sungguhan.

---

## Troubleshooting

**Scraping hasilnya 0 review terus**
1. Pastikan backend jalan (`python main.py`) dan aktif di `localhost:8000`.
2. Cek Playwright browser sudah ke-install (`playwright install chromium`).
3. Coba app lain yang lebih populer buat mastiin bukan masalah environment.

**Data hilang setelah refresh / ganti browser**
Ini normal — data disimpan di `localStorage`, bukan server.

**Chart nunjukin angka aneh / kosong**
Biasanya karena data review-nya terlalu sedikit buat metrik tertentu (misal trend butuh minimal beberapa hari data buat bisa dibandingin).

---

## Roadmap

- [ ] Autentikasi sungguhan (ganti mock login)
- [ ] Backend/database tersentralisasi (opsional, buat pemakaian tim)
- [ ] Perbaikan akurasi deteksi topik & sentimen
- [ ] Dukungan multi-negara di luar ID & MY

---

<p align="center">Dibuat dengan ❤️ — masih terus dikembangkan.</p>
