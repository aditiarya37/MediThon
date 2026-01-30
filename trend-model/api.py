from fastapi import FastAPI
from pymongo import MongoClient
import pandas as pd
from datetime import datetime
from model.trend_model import detect_trends

app = FastAPI()

# --- CONFIGURATION (UPDATED) ---
# We use the credentials that just worked in your diagnostic script
username = "aditiarya"
password = "medithon"  # The new password you set

MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.rdqu8e8.mongodb.net/medithon?appName=Cluster0"

# Connect to the correct database ("medithon")
client = MongoClient(MONGO_URI)
db = client["medithon"]
trends_col = db["trends"]
events_col = db["events"]

def refresh_events_data():
    """Fetch real-time events from MongoDB and return a CSV path"""
    events = list(events_col.find())
    
    if not events:
        return None
    
    df = pd.DataFrame(events)
    
    # Handle both timestamp formats (Python script vs Prisma)
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    elif "createdAt" in df.columns:
        df["timestamp"] = pd.to_datetime(df["createdAt"])
    
    # Bucket by minute
    df["bucket"] = df["timestamp"].dt.floor("min")
    
    agg = (
        df.groupby(["category", "bucket"])
        .size()
        .reset_index(name="count")
    )
    agg.rename(columns={"bucket": "hour"}, inplace=True)
    
    csv_path = "data/events.csv"
    agg.to_csv(csv_path, index=False)
    return csv_path

@app.post("/detect-trends")
def detect_and_store_trends():
    # 1. REFRESH DATA
    csv_path = refresh_events_data()
    
    if not csv_path:
        return {"message": "No data available"}

    # 2. RUN DETECTION
    results = detect_trends(csv_path)

    if not results:
        # If no trends, we still return 200 OK so the frontend doesn't crash
        return {"message": "No trends detected"}

    # 3. FORMAT FOR PRISMA
    prisma_compatible_results = []
    for t in results:
        prisma_compatible_results.append({
            "category": t["category"],
            "spikeScore": float(t["spike_score"]), # Ensure it's a float
            "window": "1h",
            "sampleTexts": [],
            "createdAt": datetime.now()
        })

    # 4. STORE
    # Optional: Clear old trends so the dashboard shows only the latest
    trends_col.delete_many({}) 
    trends_col.insert_many(prisma_compatible_results)

    # 5. FIX SERIALIZATION ERROR (Convert ObjectId to string)
    # This prevents the "TypeError: 'ObjectId' object is not iterable"
    for t in prisma_compatible_results:
        if "_id" in t:
            t["_id"] = str(t["_id"])

    return {
        "message": "Trends detected and stored",
        "count": len(prisma_compatible_results),
        "trends": prisma_compatible_results
    }