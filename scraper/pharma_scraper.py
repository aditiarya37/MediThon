import os
import csv
import asyncio
import aiohttp
import datetime
import time
import feedparser
import requests
from dotenv import load_dotenv
from bs4 import BeautifulSoup

load_dotenv()

OUTPUT_FILE = "pharma_mentions.csv"

# ------------------ Utils ------------------
def now():
    return datetime.datetime.utcnow().isoformat()

def clean_text(text: str) -> str:
    """Remove HTML tags and normalize whitespace"""
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    return " ".join(soup.get_text().split())

def save_rows(rows):
    if not rows:
        return

    file_exists = os.path.exists(OUTPUT_FILE)
    with open(OUTPUT_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["text", "source", "timestamp", "url"]
        )
        if not file_exists:
            writer.writeheader()
        writer.writerows(rows)

# ------------------ Google News ------------------
async def scrape_news():
    key = os.getenv("NEWS_API_KEY")
    if not key:
        print("⚠️ NEWS_API_KEY missing, skipping Google News")
        return

    queries = [
        "pharmaceutical",
        "clinical trial",
        "drug safety",
        "adverse drug reaction"
    ]

    rows = []
    try:
        async with aiohttp.ClientSession() as session:
            for q in queries:
                for page in range(1, 3):
                    params = {
                        "q": q,
                        "language": "en",
                        "pageSize": 25,
                        "page": page,
                        "apiKey": key
                    }

                    async with session.get(
                        "https://newsapi.org/v2/everything",
                        params=params,
                        timeout=30
                    ) as r:
                        data = await r.json()

                    for a in data.get("articles", []):
                        if a.get("description"):
                            rows.append({
                                "text": clean_text(a["description"]),
                                "source": "Google News",
                                "timestamp": a.get("publishedAt"),
                                "url": a.get("url")
                            })

                    await asyncio.sleep(1)

        save_rows(rows[:120])

    except Exception as e:
        print("❌ Google News failed:", e)

# ------------------ PubMed ------------------
def scrape_pubmed():
    print("🔎 Scraping PubMed...")
    terms = [
        "drug clinical trial",
        "adverse drug reaction",
        "pharmacovigilance",
        "drug safety study"
    ]

    rows = []

    try:
        for term in terms:
            r = requests.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
                params={
                    "db": "pubmed",
                    "term": term,
                    "retmode": "json",
                    "retmax": 15
                },
                timeout=(5, 30)
            )

            ids = r.json()["esearchresult"]["idlist"]

            for pid in ids:
                try:
                    fr = requests.get(
                        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
                        params={
                            "db": "pubmed",
                            "id": pid,
                            "retmode": "text",
                            "rettype": "abstract"
                        },
                        timeout=(5, 60)
                    )

                    rows.append({
                        "text": clean_text(fr.text[:1000]),
                        "source": "PubMed",
                        "timestamp": now(),
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pid}/"
                    })

                    time.sleep(0.4)

                except:
                    continue

        save_rows(rows[:60])

    except Exception as e:
        print("❌ PubMed failed:", e)

# ------------------ FDA Alerts ------------------
def scrape_fda():
    print("🔎 Scraping FDA alerts...")
    try:
        feed = feedparser.parse(
            "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drug-safety-and-availability/rss.xml"
        )

        rows = []
        for entry in feed.entries[:50]:
            rows.append({
                "text": clean_text(entry.summary),
                "source": "FDA Alerts",
                "timestamp": entry.get("published"),
                "url": entry.link
            })

        save_rows(rows)

    except Exception as e:
        print("❌ FDA RSS failed:", e)

# ------------------ ClinicalTrials.gov (SAFE) ------------------
def scrape_clinical_trials():
    print("🔎 Scraping ClinicalTrials.gov...")
    rows = []

    try:
        r = requests.get(
            "https://clinicaltrials.gov/api/v2/studies",
            params={
                "query.term": "drug",
                "pageSize": 100
            },
            timeout=(5, 30)
        )

        # Validate JSON response
        if "application/json" not in r.headers.get("Content-Type", ""):
            print("⚠️ ClinicalTrials returned non-JSON, skipping")
            return

        data = r.json()
        studies = data.get("studies", [])

        for s in studies:
            summary = (
                s.get("protocolSection", {})
                .get("descriptionModule", {})
                .get("briefSummary", "")
            )

            if summary:
                rows.append({
                    "text": clean_text(summary[:1000]),
                    "source": "ClinicalTrials",
                    "timestamp": now(),
                    "url": "https://clinicaltrials.gov/"
                })

        save_rows(rows[:80])

    except Exception as e:
        print("❌ ClinicalTrials failed:", e)

# ------------------ WHO News ------------------
def scrape_who():
    print("🔎 Scraping WHO news...")
    try:
        feed = feedparser.parse("https://www.who.int/rss-feeds/news-english.xml")

        rows = []
        for entry in feed.entries[:40]:
            rows.append({
                "text": clean_text(entry.summary),
                "source": "WHO News",
                "timestamp": entry.get("published"),
                "url": entry.link
            })

        save_rows(rows)

    except Exception as e:
        print("❌ WHO RSS failed:", e)

# ------------------ Runner ------------------
async def main():
    await scrape_news()
    scrape_pubmed()
    scrape_fda()
    scrape_clinical_trials()
    scrape_who()
    print("✅ Clean pharma dataset generated (300+ rows)")

if __name__ == "__main__":
    asyncio.run(main())
