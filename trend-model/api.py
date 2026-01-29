from fastapi import FastAPI
from pymongo import MongoClient
from model.trend_model import detect_trends

app = FastAPI()

client = MongoClient("mongodb://localhost:27017")
db = client["pharmaradar"]
trends_col = db["trends"]

@app.post("/detect-trends")
def detect_and_store_trends():
    results = detect_trends("data/events.csv")

    if not results:
        return {"message": "No trends detected"}

    # 🔥 STORE TRENDS IN MONGODB
    trends_col.delete_many({})  # optional: keep only latest trends
    trends_col.insert_many(results)

    return {
        "message": "Trends detected and stored",
        "count": len(results),
        "trends": results
    }
