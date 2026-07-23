#!/usr/bin/env python3
"""
ReviewPulse Backend v5.0 - ID & MY + Sumber JSON (amp-api) + Fallback RSS
==========================================================================
Perubahan utama dari v4.1:
- Sumber data UTAMA sekarang JSON endpoint yang dipakai App Store web asli
  (amp-api.apps.apple.com), bukan RSS XML lama yang sering "OK tapi kosong".
- Token bearer diambil otomatis dari halaman apps.apple.com/{country}/app/id{id}.
- RSS XML lama tetap dipertahankan sebagai FALLBACK kalau JSON API gagal
  (token tidak ketemu / diblokir / dsb), supaya tetap ada hasil.
- debug_mode menampilkan status token, offset, jumlah item per request.

PENTING: Struktur HTML/JSON App Store bisa berubah sewaktu-waktu di sisi
Apple. Kalau tiba-tiba 0 hasil lagi dari JSON API, cek dulu apakah token
masih berhasil diambil (lihat log "Token didapat" / "Token tidak ditemukan").
"""

import requests
import xml.etree.ElementTree as ET
import time
import random
import re
import json
import urllib.parse
from typing import List, Dict, Optional, Tuple
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import calendar

# ============================================================================
# LOGGING SIMPEL
# ============================================================================
class Log:
    @staticmethod
    def ok(msg: str): print(f"✅ {msg}", flush=True)
    @staticmethod
    def info(msg: str): print(f"ℹ️  {msg}", flush=True)
    @staticmethod
    def warn(msg: str): print(f"⚠️  {msg}", flush=True)
    @staticmethod
    def err(msg: str): print(f"❌ {msg}", flush=True)
    @staticmethod
    def wait(msg: str): print(f"⏳ {msg}", flush=True)
    @staticmethod
    def debug(msg: str): print(f"🐛 {msg}", flush=True)

# ============================================================================
# EXCEPTIONS
# ============================================================================
class TokenExpired(Exception):
    pass

# ============================================================================
# DATE FILTER
# ============================================================================
class DateFilter:
    """
    Apple tidak sediakan parameter 'sejak tanggal X' di RSS/JSON.
    Jadi kita filter di sisi kita: parse tanggal tiap review, dan karena
    review sudah terurut dari terbaru, begitu ketemu halaman yang SEMUA
    isinya lebih tua dari cutoff, pagination dihentikan (hemat request).
    """

    @staticmethod
    def parse(date_str: str) -> Optional[datetime]:
        if not date_str:
            return None
        try:
            s = date_str.strip()
            if s.endswith("Z"):
                s = s[:-1] + "+00:00"
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None

    @staticmethod
    def months_ago(months: int) -> datetime:
        now = datetime.now(timezone.utc)
        year = now.year
        month = now.month - months
        while month <= 0:
            month += 12
            year -= 1
        day = min(now.day, calendar.monthrange(year, month)[1])
        return now.replace(year=year, month=month, day=day)

# ============================================================================
# ANTI-BLOCK
# ============================================================================
class AntiBlock:
    USER_AGENTS = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    ]

    # UA khusus desktop untuk ambil halaman token (apps.apple.com).
    # UA mobile (iPhone) bikin Apple redirect ke skema itms-appss:// (buka app
    # App Store native) yang tidak bisa ditangani `requests` -> selalu pakai
    # UA desktop untuk request ini supaya dapat HTML biasa, bukan redirect.
    DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

    @classmethod
    def get_ua(cls) -> str:
        return random.choice(cls.USER_AGENTS)

    @classmethod
    def delay(cls, base: float = 2.5):
        d = random.uniform(base, base + 3)
        Log.wait(f"Jeda {d:.1f} detik...")
        time.sleep(d)
        return d

# ============================================================================
# TRANSLATOR
# ============================================================================
try:
    from deep_translator import GoogleTranslator
    TRANSLATOR = GoogleTranslator(source='auto', target='id')
    TRANSLATE_OK = True
    Log.ok("Translator aktif")
except ImportError:
    TRANSLATE_OK = False
    TRANSLATOR = None
    Log.warn("pip install deep_translator")

# ============================================================================
# FASTAPI
# ============================================================================
app = FastAPI(title="ReviewPulse API v5.1", version="5.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELS
# ============================================================================
class ScrapeRequest(BaseModel):
    app_id: str = Field(..., description="App ID (angka)")
    app_name: str = Field("", description="Nama app (auto-lookup)")
    country: str = Field("id", description="id atau my")
    pages: int = Field(10, description="Halaman (max 15), tiap halaman = 20 review dari JSON API", ge=1, le=15)
    debug_mode: bool = Field(False, description="Tampilkan detail request/response untuk debug")
    months_back: Optional[int] = Field(
        None,
        description="Filter: hanya ambil review dalam N bulan terakhir (mis. 6). Kosongkan/None untuk tanpa filter tanggal.",
        ge=1, le=60,
    )

class ReviewItem(BaseModel):
    source: str; app_id: str; app_name: str; author: str
    title: str; text: str; rating: int; version: str
    helpful_votes: int; total_votes: int; date: str

class ScrapeResponse(BaseModel):
    success: bool; app_name: str; total_reviews: int
    reviews: List[ReviewItem]; scraped_at: str; message: str
    countries_scraped: List[str]; debug_info: Optional[Dict]

# ============================================================================
# CONFIG
# ============================================================================
class Config:
    TARGET = 120
    MAX_PAGES = 15
    RETRY = 2
    DELAY_BASE = 2.5

    # HANYA ID & MY
    COUNTRIES = ["id", "my"]

# ============================================================================
# TRANSLATOR SERVICE
# ============================================================================
class TranslatorService:
    def __init__(self):
        self.translator = TRANSLATOR
        self.failed = 0

    def translate(self, text: str) -> str:
        if not text or len(text.strip()) < 3 or not TRANSLATE_OK:
            return text
        try:
            return self.translator.translate(text) or text
        except Exception:
            self.failed += 1
            return text

# ============================================================================
# LOOKUP
# ============================================================================
class LookupService:
    @staticmethod
    def validate(app_id: str) -> Tuple[bool, str]:
        cleaned = re.sub(r'\D', '', app_id.strip())
        if not cleaned or len(cleaned) < 5:
            return False, "App ID harus angka 9-10 digit"
        return True, cleaned

    @staticmethod
    def lookup(app_id: str, country: str = "us") -> Optional[Dict]:
        try:
            url = f"https://itunes.apple.com/lookup?id={app_id}&country={country}"
            resp = requests.get(url, timeout=10)
            data = resp.json()
            if data.get("resultCount", 0) > 0:
                app = data["results"][0]
                return {
                    "name": app.get("trackName", "Unknown"),
                    "dev": app.get("artistName", "Unknown"),
                    "rating": app.get("averageUserRating"),
                    "count": app.get("userRatingCount", 0),
                }
            return None
        except Exception:
            return None

# ============================================================================
# SAFE SESSION
# ============================================================================
class SafeSession:
    def __init__(self):
        self.session = requests.Session()
        self._refresh()
        self.req_count = 0

    def _refresh(self):
        self.session.headers.update({
            "User-Agent": AntiBlock.get_ua(),
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        })
        Log.info(f"Session baru | UA: {self.session.headers['User-Agent'][:40]}...")

    def get(self, url: str, headers: Optional[Dict] = None, timeout: int = 15) -> requests.Response:
        if self.req_count >= 8:
            Log.info("Refresh session")
            self._refresh()
            self.req_count = 0

        last_err = None
        for attempt in range(Config.RETRY):
            try:
                AntiBlock.delay(Config.DELAY_BASE)
                Log.info(f"Request | {url[:70]}...")
                resp = self.session.get(url, headers=headers, timeout=timeout)
                self.req_count += 1

                if resp.status_code == 401:
                    raise TokenExpired("401 dari amp-api")

                if resp.status_code == 403:
                    Log.err("Diblokir Apple (403)! Ganti session...")
                    self._refresh()
                    raise Exception("Blocked (403)")

                if resp.status_code == 429:
                    Log.err("Rate limit (429)! Tunggu 60 detik...")
                    time.sleep(60)
                    raise Exception("Rate limited")

                resp.raise_for_status()
                Log.ok(f"Response OK | {len(resp.content)} bytes")
                return resp

            except TokenExpired:
                raise
            except requests.exceptions.InvalidSchema as e:
                Log.warn(f"Redirect ke skema tidak didukung: {str(e)[:80]}")
                raise
            except Exception as e:
                last_err = e
                if attempt == Config.RETRY - 1:
                    raise
                Log.warn(f"Retry {attempt + 1}...")
        raise last_err

# ============================================================================
# TOKEN SERVICE (untuk JSON amp-api, sumber data App Store web asli)
# ============================================================================
class TokenService:
    """
    App Store web (apps.apple.com) memuat bearer token di dalam HTML
    halaman detail app, dipakai untuk request ke amp-api.apps.apple.com.
    Token ini yang sama persis dipakai browser saat kamu buka App Store
    di web dan scroll ke bagian review.
    """
    _cache: Dict[str, Tuple[str, float]] = {}
    TTL = 60 * 25  # cache 25 menit, token biasanya berlaku cukup lama

    @classmethod
    def get_token(cls, country: str, app_id: str, force: bool = False, debug: bool = False) -> Optional[str]:
        now = time.time()
        if not force:
            cached = cls._cache.get(country)
            if cached and (now - cached[1]) < cls.TTL:
                if debug:
                    Log.debug(f"Pakai token cache untuk {country.upper()}")
                return cached[0]

        url = f"https://apps.apple.com/{country}/app/id{app_id}"
        headers = {
            # SELALU pakai UA desktop di sini. UA mobile bikin Apple redirect
            # ke skema itms-appss:// (buka App Store app) yang tidak bisa
            # ditangani oleh `requests` dan bikin exception aneh.
            "User-Agent": AntiBlock.DESKTOP_UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        html = cls._fetch_html_follow_safe(url, headers, debug=debug)
        if html is None:
            return None

        token = cls._extract_token(html)
        if token:
            cls._cache[country] = (token, now)
            if debug:
                Log.debug(f"Token didapat ({country.upper()}): {token[:24]}...")
            return token

        Log.warn(f"Token tidak ditemukan di halaman App Store ({country.upper()})")
        if debug:
            has_media_api = "MEDIA_API" in html or "media_api" in html.lower()
            has_config_meta = "web-experience-app/config/environment" in html
            meta_tag_count = html.count("<meta")
            Log.debug(
                f"HTML length: {len(html)} | mengandung 'MEDIA_API': {has_media_api} | "
                f"ada meta config tag: {has_config_meta} | total tag <meta>: {meta_tag_count}"
            )
            Log.debug(f"HTML preview: {html[:800]}")
        return None

    @staticmethod
    def _fetch_html_follow_safe(url: str, headers: Dict, max_redirects: int = 5, debug: bool = False) -> Optional[str]:
        """
        Ambil HTML dengan redirect manual, supaya kalau Apple redirect ke
        skema non-HTTP (itms-apps://, itms-appss://) kita tangani dengan
        rapi (return None) alih-alih crash di requests.
        """
        current_url = url
        for hop in range(max_redirects):
            try:
                resp = requests.get(current_url, headers=headers, timeout=15, allow_redirects=False)
            except requests.exceptions.InvalidSchema as e:
                Log.warn(f"Redirect ke skema tidak didukung (kemungkinan itms-apps/itms-appss): {str(e)[:80]}")
                return None
            except Exception as e:
                Log.warn(f"Gagal fetch halaman token: {str(e)[:80]}")
                return None

            if resp.status_code in (301, 302, 303, 307, 308):
                loc = resp.headers.get("Location", "")
                if debug:
                    Log.debug(f"Redirect hop {hop + 1} -> {loc[:100]}")
                if not (loc.startswith("http://") or loc.startswith("https://")):
                    Log.warn(f"Redirect ke skema non-HTTP ({loc[:30]}...), server anggap ini client mobile")
                    return None
                current_url = loc
                continue

            if resp.status_code != 200:
                Log.warn(f"Status {resp.status_code} saat ambil halaman token")
                return None

            return resp.text

        Log.warn("Terlalu banyak redirect saat ambil halaman token")
        return None

    @staticmethod
    def _extract_token(html: str) -> Optional[str]:
        import html as html_lib

        # Normalisasi: decode HTML entity (&quot; dll) karena kadang atribut
        # meta tag di-escape pakai &quot; alih-alih tanda kutip biasa.
        unescaped = html_lib.unescape(html)

        candidates = [html, unescaped]

        # Cara 1: meta tag config environment (URL-encoded JSON), toleran
        # terhadap tanda kutip " atau '
        for candidate in candidates:
            m = re.search(
                r'''name=["']web-experience-app/config/environment["']\s+content=["']([^"']+)["']''',
                candidate,
            )
            if m:
                raw = m.group(1)
                for decoded in (raw, urllib.parse.unquote(raw), html_lib.unescape(raw)):
                    try:
                        config = json.loads(decoded)
                        token = config.get("MEDIA_API", {}).get("token")
                        if token:
                            return token
                    except Exception:
                        continue

        # Cara 2: fallback regex cari pola "token":"..." langsung di HTML
        # (kadang di-encode, kadang tidak, jadi coba beberapa variasi)
        for candidate in candidates + [urllib.parse.unquote(html), urllib.parse.unquote(unescaped)]:
            m2 = re.search(r'"token"\s*:\s*"([A-Za-z0-9\-_.]{20,})"', candidate)
            if m2:
                return m2.group(1)

        return None

# ============================================================================
# JSON SCRAPER (amp-api) - SUMBER UTAMA
# ============================================================================
class AmpApiScraper:
    BASE = "https://amp-api.apps.apple.com/v1/catalog/{country}/apps/{app_id}/reviews"

    def __init__(self, session: SafeSession):
        self.session = session

    def fetch_page(self, country: str, app_id: str, token: str, offset: int, debug: bool = False) -> Dict:
        params = {
            "l": "en-US",
            "offset": offset,
            "limit": 20,
            "platform": "web",
            "additionalPlatforms": "appletv,ipad,iphone,mac",
            "sort": "-createDate",
        }
        url = self.BASE.format(country=country, app_id=app_id) + "?" + urllib.parse.urlencode(params)
        headers = {
            "Authorization": f"Bearer {token}",
            "Origin": "https://apps.apple.com",
            "Referer": f"https://apps.apple.com/{country}/app/id{app_id}",
            "User-Agent": AntiBlock.get_ua(),
            "Accept": "application/json",
        }
        resp = self.session.get(url, headers=headers)
        data = resp.json()
        if debug:
            Log.debug(f"JSON keys: {list(data.keys())} | items: {len(data.get('data', []))}")
        return data

    @staticmethod
    def extract_review(item: Dict) -> Optional[Dict]:
        attrs = item.get("attributes", {}) or {}
        title_text = attrs.get("title", "") or ""
        review_text = attrs.get("review", "") or ""

        if not title_text and not review_text:
            return None

        try:
            rating = int(attrs.get("rating", 0) or 0)
        except (TypeError, ValueError):
            rating = 0

        return {
            "author": attrs.get("userName", "Anonymous") or "Anonymous",
            "title": title_text,
            "text": review_text,
            "rating": rating,
            "version": "",  # amp-api reviews tidak selalu sertakan versi app
            "helpful_votes": 0,  # tidak tersedia di endpoint ini
            "total_votes": 0,
            "date": attrs.get("date", "") or "",
        }

# ============================================================================
# XML PARSER (RSS lama) - FALLBACK
# ============================================================================
class XMLParser:
    NS = {
        'atom': 'http://www.w3.org/2005/Atom',
        'im': 'http://itunes.apple.com/rss'
    }

    @classmethod
    def parse_reviews(cls, xml_content: bytes, debug: bool = False) -> List[ET.Element]:
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            Log.err(f"XML parse error: {e}")
            return []

        entries = root.findall('.//atom:entry', cls.NS)
        if not entries:
            entries = root.findall('.//{http://www.w3.org/2005/Atom}entry')
        if not entries:
            entries = root.findall('.//entry')

        if debug:
            Log.debug(f"Total entry ditemukan: {len(entries)}")

        reviews = []
        for entry in entries:
            id_elem = entry.find('atom:id', cls.NS)
            if id_elem is None:
                id_elem = entry.find('id')

            if id_elem is not None:
                id_text = id_elem.text or ""
                if 'customerreviews' in id_text:
                    continue

            author = entry.find('atom:author', cls.NS)
            if author is None:
                author = entry.find('author')

            if author is not None:
                reviews.append(entry)

        if debug:
            Log.debug(f"Entry review valid: {len(reviews)}")

        return reviews

    @classmethod
    def extract_review(cls, entry: ET.Element, debug: bool = False) -> Optional[Dict]:
        ns = cls.NS

        def find(tag: str):
            elem = entry.find(f'atom:{tag}', ns)
            if elem is not None:
                return elem
            return entry.find(tag)

        def find_im(tag: str):
            elem = entry.find(f'im:{tag}', ns)
            if elem is not None:
                return elem
            return entry.find(tag)

        author = find('author')
        title = find('title')
        content = find('content')
        rating = find_im('rating')
        version = find_im('version')
        vote_sum = find_im('voteSum')
        vote_count = find_im('voteCount')
        updated = find('updated')

        author_name = "Anonymous"
        if author is not None:
            name_elem = author.find('atom:name', ns)
            if name_elem is None:
                name_elem = author.find('name')
            if name_elem is not None:
                author_name = name_elem.text or "Anonymous"

        title_text = title.text if title is not None else ""
        content_text = content.text if content is not None else ""

        if not title_text and not content_text:
            return None

        return {
            "author": author_name,
            "title": title_text,
            "text": content_text,
            "rating": int(rating.text) if rating is not None and rating.text else 0,
            "version": version.text if version is not None else "",
            "helpful_votes": int(vote_sum.text) if vote_sum is not None and vote_sum.text else 0,
            "total_votes": int(vote_count.text) if vote_count is not None and vote_count.text else 0,
            "date": updated.text if updated is not None else "",
        }

# ============================================================================
# SCRAPER
# ============================================================================
class Scraper:
    def __init__(self):
        self.session = SafeSession()
        self.translator = TranslatorService()
        self.lookup = LookupService()
        self.amp = AmpApiScraper(self.session)

    def scrape(self, app_id_raw: str, app_name_input: str = "", country: str = "id",
               pages: int = 10, debug_mode: bool = False, months_back: Optional[int] = None) -> Dict:

        reviews: List[Dict] = []
        countries_done = []
        debug_info = {"xml_checks": [], "errors": []}

        cutoff = DateFilter.months_ago(months_back) if months_back else None

        Log.ok("=" * 50)
        Log.ok("ReviewPulse v5.1 | Sumber: JSON amp-api (utama) + RSS (fallback)")
        if cutoff:
            Log.ok(f"Filter tanggal: hanya review {months_back} bulan terakhir (sejak {cutoff.date()})")
        Log.ok("=" * 50)

        ok, app_id = self.lookup.validate(app_id_raw)
        if not ok:
            return self._error(app_id, app_name_input)

        info = None
        for c in ["us", "id", "my"]:
            info = self.lookup.lookup(app_id, c)
            if info:
                break

        if not info:
            return self._error("App tidak ditemukan", app_name_input)

        app_name = app_name_input or info["name"]
        Log.ok(f"App: {app_name} | {info['dev']}")
        Log.ok(f"Rating: {info['rating']}/5 | Reviews: {info['count']:,}")

        if country in Config.COUNTRIES:
            countries = [country] + [c for c in Config.COUNTRIES if c != country]
        else:
            countries = Config.COUNTRIES

        Log.ok(f"Negara: {', '.join(countries).upper()}")
        Log.ok("-" * 50)

        for idx, ctry in enumerate(countries):
            if len(reviews) >= Config.TARGET:
                break

            Log.ok(f"[{idx + 1}] {ctry.upper()}")
            ctry_count = 0

            if debug_mode:
                ctry_info = self.lookup.lookup(app_id, ctry)
                if ctry_info:
                    Log.debug(
                        f"  Info storefront {ctry.upper()}: rating={ctry_info['rating']} | "
                        f"jumlah_rating={ctry_info['count']:,} (ini rating count global app di storefront ini, "
                        f"bukan jumlah review teks - App Store tidak expose jumlah review teks per negara)"
                    )
                else:
                    Log.debug(f"  App tidak terdaftar di storefront {ctry.upper()} sama sekali")

            # --- Coba sumber utama: JSON amp-api ---
            token = TokenService.get_token(ctry, app_id, debug=debug_mode)
            if token:
                ctry_count += self._scrape_json(
                    ctry, app_id, app_name, token, pages, reviews, debug_info, debug_mode, cutoff
                )
            else:
                debug_info["errors"].append(f"{ctry}: token tidak ditemukan")

            # --- Fallback ke RSS lama kalau JSON API tidak menghasilkan apa-apa ---
            if ctry_count == 0:
                Log.warn(f"  JSON API kosong/gagal untuk {ctry.upper()}, coba fallback RSS...")
                ctry_count += self._scrape_rss(
                    ctry, app_id, app_name, pages, reviews, debug_info, debug_mode, cutoff
                )

            if ctry_count > 0:
                countries_done.append(ctry)

        Log.ok("-" * 50)
        msg = f"Selesai: {len(reviews)} review dari {len(countries_done)} negara ({', '.join(countries_done).upper()})"
        if cutoff:
            msg += f" | filter {months_back} bulan terakhir"
        if self.translator.failed > 0:
            msg += f" | {self.translator.failed} translate gagal"

        Log.ok(msg)
        Log.ok("=" * 50)

        return {
            "success": len(reviews) > 0,
            "app_name": app_name,
            "total_reviews": len(reviews),
            "reviews": reviews,
            "scraped_at": datetime.now().isoformat(),
            "message": msg,
            "countries_scraped": countries_done,
            "debug_info": debug_info if debug_mode else None,
        }

    def _scrape_json(self, ctry: str, app_id: str, app_name: str, token: str, pages: int,
                      reviews: List[Dict], debug_info: Dict, debug_mode: bool,
                      cutoff: Optional[datetime] = None) -> int:
        added = 0
        offset = 0
        max_offset = min(pages, Config.MAX_PAGES) * 20
        retried_token = False

        while offset < max_offset and len(reviews) < Config.TARGET:
            try:
                data = self.amp.fetch_page(ctry, app_id, token, offset, debug=debug_mode)
            except TokenExpired:
                if retried_token:
                    Log.err("  Token expired lagi setelah refresh, stop JSON API")
                    debug_info["errors"].append(f"{ctry}: token expired 2x")
                    break
                Log.warn("  Token kedaluwarsa, ambil token baru...")
                new_token = TokenService.get_token(ctry, app_id, force=True, debug=debug_mode)
                retried_token = True
                if not new_token:
                    break
                token = new_token
                continue
            except Exception as e:
                err_msg = str(e)[:60]
                Log.err(f"  JSON offset={offset}: {err_msg}")
                debug_info["errors"].append(f"{ctry} json offset={offset}: {err_msg}")
                break

            items = data.get("data", [])
            if debug_mode:
                debug_info["xml_checks"].append({
                    "country": ctry, "offset": offset, "source": "json_amp_api",
                    "items": len(items),
                })

            if not items:
                Log.warn(f"  Offset {offset}: 0 item dari JSON API")
                break

            page_added = 0
            page_skipped_old = 0
            for item in items:
                review_data = AmpApiScraper.extract_review(item)
                if review_data is None:
                    continue

                if cutoff:
                    review_dt = DateFilter.parse(review_data["date"])
                    if review_dt and review_dt < cutoff:
                        page_skipped_old += 1
                        continue

                review_data["title"] = self.translator.translate(review_data["title"])
                review_data["text"] = self.translator.translate(review_data["text"])
                review_data["source"] = "app_store"
                review_data["app_id"] = app_id
                review_data["app_name"] = app_name

                reviews.append(review_data)
                added += 1
                page_added += 1

                if len(reviews) >= Config.TARGET:
                    break

            Log.ok(f"  [JSON] Offset {offset}: {page_added} review | Total: {len(reviews)}/{Config.TARGET}")

            if cutoff and page_added == 0 and page_skipped_old > 0:
                Log.info(f"  Semua review di offset {offset} lebih tua dari batas filter, berhenti (sudah terurut terbaru->lama)")
                break

            if not data.get("next"):
                break

            offset += 20

        return added

    def _scrape_rss(self, ctry: str, app_id: str, app_name: str, pages: int,
                     reviews: List[Dict], debug_info: Dict, debug_mode: bool,
                     cutoff: Optional[datetime] = None) -> int:
        added = 0

        for page in range(1, min(pages + 1, Config.MAX_PAGES + 1)):
            if len(reviews) >= Config.TARGET:
                break

            url = f"https://itunes.apple.com/{ctry}/rss/customerreviews/page={page}/id={app_id}/sortby=mostrecent/xml"

            try:
                resp = self.session.get(url)

                if debug_mode:
                    debug_info["xml_checks"].append({
                        "country": ctry, "page": page, "source": "rss_xml",
                        "size": len(resp.content),
                        "preview": resp.text[:200],
                    })

                entries = XMLParser.parse_reviews(resp.content, debug=debug_mode)

                if not entries:
                    if page == 1 and len(resp.content) < 1200:
                        Log.warn(
                            f"  [RSS] Page {page}: Feed kosong ({len(resp.content)} bytes) — "
                            f"kemungkinan besar app ini memang belum punya review teks di storefront {ctry.upper()}, "
                            f"bukan error koneksi (response tetap 200 OK)"
                        )
                    else:
                        Log.warn(f"  [RSS] Page {page}: Tidak ada review entry")
                    break

                page_count = 0
                page_skipped_old = 0
                for entry in entries:
                    review_data = XMLParser.extract_review(entry, debug=debug_mode)
                    if review_data is None:
                        continue

                    if cutoff:
                        review_dt = DateFilter.parse(review_data["date"])
                        if review_dt and review_dt < cutoff:
                            page_skipped_old += 1
                            continue

                    review_data["title"] = self.translator.translate(review_data["title"])
                    review_data["text"] = self.translator.translate(review_data["text"])
                    review_data["source"] = "app_store"
                    review_data["app_id"] = app_id
                    review_data["app_name"] = app_name

                    reviews.append(review_data)
                    page_count += 1
                    added += 1

                    if len(reviews) >= Config.TARGET:
                        break

                Log.ok(f"  [RSS] Page {page}: {page_count} review | Total: {len(reviews)}/{Config.TARGET}")

                if cutoff and page_count == 0 and page_skipped_old > 0:
                    Log.info(f"  Semua review di page {page} lebih tua dari batas filter, berhenti (sudah terurut terbaru->lama)")
                    break

                if page_count == 0:
                    break

            except Exception as e:
                err_msg = str(e)[:50]
                Log.err(f"  [RSS] Page {page}: {err_msg}")
                debug_info["errors"].append(f"{ctry} rss p{page}: {err_msg}")
                break

        return added

    def _error(self, msg: str, app_name: str) -> Dict:
        return {
            "success": False, "app_name": app_name or "Unknown",
            "total_reviews": 0, "reviews": [],
            "scraped_at": datetime.now().isoformat(),
            "message": msg, "countries_scraped": [],
            "debug_info": None,
        }

# ============================================================================
# ENDPOINTS
# ============================================================================
scraper = Scraper()

@app.get("/")
def root():
    return {
        "app": "ReviewPulse v5.1",
        "cakupan": "🇮🇩 Indonesia & 🇲🇾 Malaysia only",
        "sumber": "JSON amp-api (utama) + RSS XML (fallback otomatis)",
        "target": 120,
        "tips": "Kalau hasil tetap sedikit, jalankan dengan debug_mode=true dan cek log 'Token' di terminal",
    }

@app.post("/api/scrape", response_model=ScrapeResponse)
def scrape(req: ScrapeRequest):
    try:
        result = scraper.scrape(
            req.app_id, req.app_name, req.country,
            req.pages, req.debug_mode, req.months_back
        )
        return ScrapeResponse(**result)
    except Exception as e:
        Log.err(f"Endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lookup/{app_id}")
def lookup(app_id: str, country: str = "us"):
    ok, aid = LookupService.validate(app_id)
    if not ok:
        return {"error": aid}
    info = LookupService.lookup(aid, country)
    if not info:
        return {"error": "Tidak ditemukan"}
    return {"found": True, "app_id": aid, **info}

@app.get("/api/token-check/{app_id}")
def token_check(app_id: str, country: str = "id"):
    """Endpoint bantu debug: cek apakah token amp-api berhasil diambil."""
    token = TokenService.get_token(country, app_id, force=True, debug=True)
    if token:
        return {"ok": True, "country": country, "token_preview": token[:24] + "..."}
    return {"ok": False, "country": country, "message": "Token tidak ditemukan, cek log server"}

# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    Log.ok("=" * 50)
    Log.ok("ReviewPulse v5.1 | ID & MY | JSON amp-api + RSS fallback")
    Log.ok("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)