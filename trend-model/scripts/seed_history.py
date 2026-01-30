from pymongo import MongoClient
from datetime import datetime, timedelta

# Ensure this matches your local DB or the one in your .env
client = MongoClient("mongodb://localhost:27017")
db = client["pharmaradar"]
events_col = db["events"]

print("🌱 Seeding historical data for testing...")

# We need data in at least 3 different 'minute' buckets.
# We will insert data for T-10 mins and T-5 mins.
# Then your Postman requests (T-Now) will be the 3rd bucket (the Spike).

base_time = datetime.now()
historic_events = []

# Create a baseline of "normal" activity (e.g., 2 events per interval)
categories = ["SIDE_EFFECTS", "BRAND_PERCEPTION"]

for cat in categories:
    # Bucket 1: 10 minutes ago
    for _ in range(3):
        historic_events.append({
            "text": "Historical baseline data",
            "category": cat,
            "confidence": 0.85,
            "source": "seed_script",
            "createdAt": base_time - timedelta(minutes=10)
        })
    
    # Bucket 2: 5 minutes ago
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
    print(f"✅ Inserted {len(historic_events)} past events.")
    print("🚀 System is now ready for a 'Spike'. Go run your Postman requests now!")
else:
    print("❌ Failed to generate events.")