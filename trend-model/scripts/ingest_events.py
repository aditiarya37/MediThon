import csv
import requests
from pymongo import MongoClient
from datetime import datetime

CLASSIFIER_API = "http://localhost:8000/classify"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "pharmaradar"
COLLECTION = "events"

INPUT_CSV = "data/raw_texts.csv"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
events_col = db[COLLECTION]

with open(INPUT_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        text = row["text"]
        source = row.get("source", "csv_ingest")

        response = requests.post(
            CLASSIFIER_API,
            json={"text": text, "source": source},
            timeout=10
        )

        if response.status_code != 200:
            print("❌ Classifier failed for:", text[:40])
            continue

        result = response.json()

        # ✅ FIXED MAPPING
        category = result["label"]
        confidence = result["confidence"]

        doc = {
            "text": text,
            "category": category,
            "confidence": confidence,
            "source": source,
            "timestamp": datetime.utcnow()
        }

        events_col.insert_one(doc)
        print(f"✅ Stored: {category} | conf={confidence:.2f}")

print("🎉 Ingestion complete")
