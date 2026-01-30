from pymongo import MongoClient
from datetime import datetime, timedelta

# PASTE YOUR FULL ATLAS CONNECTION STRING HERE (With the password)
MONGO_URI = "mongodb+srv://aditiarya:medithon@cluster0.rdqu8e8.mongodb.net/medithon?appName=Cluster0"

client = MongoClient(MONGO_URI)

# MAKE SURE THIS MATCHES YOUR ACTUAL DATABASE NAME IN ATLAS
db = client["medithon"] 
events_col = db["events"]

print("🌱 Seeding historical data to Remote DB...")

base_time = datetime.now()
historic_events = []

# We need data in at least 3 distinct time buckets (minutes)
# Bucket 1: 10 mins ago (Baseline)
# Bucket 2: 5 mins ago (Baseline)
# Bucket 3: NOW (The Spike you will create with Postman)

categories = ["SIDE_EFFECTS", "BRAND_PERCEPTION"]

for cat in categories:
    # 3 events at T-10 minutes
    for _ in range(3):
        historic_events.append({
            "text": "Historical baseline data",
            "category": cat,
            "confidence": 0.85,
            "source": "seed_script",
            "createdAt": base_time - timedelta(minutes=10)
        })
    
    # 3 events at T-5 minutes
    for _ in range(3):
        historic_events.append({
            "text": "Historical baseline data",
            "category": cat,
            "confidence": 0.85,
            "source": "seed_script",
            "createdAt": base_time - timedelta(minutes=5)
        })

if historic_events:
    events_col.insert_many(historic_events)
    print(f"✅ Inserted {len(historic_events)} past events into 'medithon' DB.")
    print("🚀 System is ready. NOW go send 5-10 requests in Postman!")
else:
    print("❌ Failed to generate events.")