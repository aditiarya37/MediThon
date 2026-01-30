from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import pandas as pd
from datetime import datetime, timezone
from model.trend_model import detect_trends
import traceback

app = FastAPI()

# --- CONFIGURATION ---
username = "aditiarya"
password = "medithon"

MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.rdqu8e8.mongodb.net/medithon?appName=Cluster0"

# Connect to the correct database ("medithon")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB")
    db = client["medithon"]
    
    # ✅ FIXED: Use exact collection names from MongoDB
    trends_col = db["trends"]  # lowercase "trends"
    events_col = db["Event"]   # capital "Event"
    
    # Debug: List all collections to verify
    collections = db.list_collection_names()
    print(f"📋 Available collections: {collections}")
    
    # Debug: Check counts
    event_count = events_col.count_documents({})
    trend_count = trends_col.count_documents({})
    print(f"📊 Current events in database: {event_count}")
    print(f"📊 Current trends in database: {trend_count}")
    
except ConnectionFailure as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    raise

def refresh_events_data():
    """Fetch real-time events from MongoDB and return a CSV path"""
    try:
        print("\n🔍 Fetching events from MongoDB...")
        
        # Query all events
        events = list(events_col.find())
        
        if not events:
            print("⚠️ No events found in 'Event' collection")
            # Debug: try to fetch from all collections
            for coll_name in db.list_collection_names():
                count = db[coll_name].count_documents({})
                print(f"  - {coll_name}: {count} documents")
            return None
        
        print(f"📊 Found {len(events)} events in database")
        
        # Debug: Print first event to verify structure
        if events:
            print(f"📝 Sample event structure: {list(events[0].keys())}")
        
        df = pd.DataFrame(events)
        
        # Check if required columns exist
        if "category" not in df.columns:
            print(f"❌ 'category' column not found. Available columns: {df.columns.tolist()}")
            return None
        
        # Handle both timestamp formats (Python script vs Prisma)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            print("✅ Using 'timestamp' column")
        elif "createdAt" in df.columns:
            df["timestamp"] = pd.to_datetime(df["createdAt"])
            print("✅ Using 'createdAt' column")
        else:
            print(f"❌ No timestamp column found. Available columns: {df.columns.tolist()}")
            return None
        
        # Bucket by minute
        df["bucket"] = df["timestamp"].dt.floor("min")
        
        # Aggregate
        agg = (
            df.groupby(["category", "bucket"])
            .size()
            .reset_index(name="count")
        )
        agg.rename(columns={"bucket": "hour"}, inplace=True)
        
        print(f"📊 Aggregated data:\n{agg}")
        
        csv_path = "data/events.csv"
        agg.to_csv(csv_path, index=False)
        print(f"✅ Saved aggregated data to {csv_path}")
        return csv_path
        
    except Exception as e:
        print(f"❌ Error refreshing events data: {e}")
        traceback.print_exc()
        return None

@app.post("/detect-trends")
def detect_and_store_trends():
    try:
        print("\n" + "="*50)
        print("🔍 Starting trend detection...")
        print("="*50)
        
        # 1. REFRESH DATA
        csv_path = refresh_events_data()
        
        if not csv_path:
            return {
                "message": "No data available for trend detection",
                "count": 0,
                "trends": []
            }

        # 2. RUN DETECTION
        print("\n🔍 Running trend detection algorithm...")
        results = detect_trends(csv_path)

        if not results:
            print("⚠️ No trends detected")
            return {
                "message": "No trends detected",
                "count": 0,
                "trends": []
            }

        print(f"✅ Detected {len(results)} trends:")
        for r in results:
            print(f"  - {r['category']}: {r['spike_score']}x spike")

        # 3. FORMAT FOR PRISMA
        prisma_compatible_results = []
        for t in results:
            # Convert category string to match Prisma enum format
            category_value = t["category"]
            
            # Create UTC datetime for MongoDB BSON Date
            now = datetime.now(timezone.utc)
            
            prisma_compatible_results.append({
                "category": category_value,
                "spikeScore": float(t["spike_score"]),
                "window": "1h",
                "sampleTexts": [],
                "createdAt": now  # This will be stored as BSON Date
            })

        # 4. STORE IN DATABASE
        # Clear old trends
        delete_result = trends_col.delete_many({})
        print(f"\n🗑️ Deleted {delete_result.deleted_count} old trends")
        
        # Insert new trends
        insert_result = trends_col.insert_many(prisma_compatible_results)
        print(f"💾 Inserted {len(insert_result.inserted_ids)} new trends into 'trends' collection")

        # 5. FIX SERIALIZATION ERROR (Convert ObjectId and DateTime to string for JSON response)
        response_trends = []
        for t in prisma_compatible_results:
            trend_copy = t.copy()
            if "_id" in trend_copy:
                trend_copy["_id"] = str(trend_copy["_id"])
            # Convert datetime to ISO string for JSON response
            if "createdAt" in trend_copy and isinstance(trend_copy["createdAt"], datetime):
                trend_copy["createdAt"] = trend_copy["createdAt"].isoformat()
            response_trends.append(trend_copy)

        # 6. VERIFY DATA WAS STORED
        stored_trends = trends_col.count_documents({})
        print(f"✅ Verified: {stored_trends} trends now in database")

        print(f"✅ Trend detection complete: {len(prisma_compatible_results)} trends stored")
        print("="*50 + "\n")

        return {
            "message": "Trends detected and stored",
            "count": len(prisma_compatible_results),
            "trends": response_trends  # Use serialized version for response
        }
    
    except Exception as e:
        print(f"❌ Error in detect_and_store_trends: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint to verify service is running"""
    try:
        # Test MongoDB connection
        client.admin.command('ping')
        event_count = events_col.count_documents({})
        trend_count = trends_col.count_documents({})
        return {
            "status": "healthy",
            "mongodb": "connected",
            "database": "medithon",
            "events_count": event_count,
            "trends_count": trend_count,
            "collections": db.list_collection_names()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.get("/debug/events")
def debug_events():
    """Debug endpoint to see raw events"""
    try:
        events = list(events_col.find().limit(5))
        # Convert ObjectId to string for JSON serialization
        for e in events:
            e["_id"] = str(e["_id"])
        return {
            "count": events_col.count_documents({}),
            "sample_events": events
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/trends")
def debug_trends():
    """Debug endpoint to see raw trends"""
    try:
        trends = list(trends_col.find().limit(5))
        # Convert ObjectId to string for JSON serialization
        for t in trends:
            t["_id"] = str(t["_id"])
            if "createdAt" in t:
                t["createdAt"] = str(t["createdAt"])
        return {
            "count": trends_col.count_documents({}),
            "sample_trends": trends
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Trend Detection API on http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)