"""
Enhanced Trend Detection API with Comprehensive Analytics
"""
from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import pandas as pd
from datetime import datetime, timezone
from model.trend_model import detect_trends, format_trend_summary
import traceback

app = FastAPI()

# --- CONFIGURATION ---
username = "aditiarya"
password = "medithon"

MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.rdqu8e8.mongodb.net/medithon?appName=Cluster0"

# Connect to MongoDB
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB")
    db = client["medithon"]
    
    trends_col = db["trends"]
    events_col = db["Event"]
    
    collections = db.list_collection_names()
    print(f"📋 Available collections: {collections}")
    
    event_count = events_col.count_documents({})
    trend_count = trends_col.count_documents({})
    print(f"📊 Current events: {event_count}, trends: {trend_count}")
    
except ConnectionFailure as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    raise


def refresh_events_data():
    """
    Fetch events from MongoDB and prepare both:
    1. Aggregated CSV for trend detection
    2. Raw events DataFrame for sampling
    """
    try:
        print("\n🔍 Fetching events from MongoDB...")
        
        # Fetch all events
        events = list(events_col.find())
        
        if not events:
            print("⚠️ No events found in database")
            return None, None
        
        print(f"📊 Found {len(events)} events")
        
        # Create DataFrame
        df = pd.DataFrame(events)
        
        # Validate required columns
        if "category" not in df.columns:
            print(f"❌ Missing 'category' column. Available: {df.columns.tolist()}")
            return None, None
        
        # Handle timestamp
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        elif "createdAt" in df.columns:
            df["timestamp"] = pd.to_datetime(df["createdAt"])
        else:
            print(f"❌ No timestamp column. Available: {df.columns.tolist()}")
            return None, None
        
        # Ensure we have text and source columns for sampling
        if "text" not in df.columns:
            df["text"] = "No text available"
        if "source" not in df.columns:
            df["source"] = "unknown"
        
        # Keep raw events for sampling
        raw_events_df = df.copy()
        
        # Create aggregated data (bucket by minute)
        df["bucket"] = df["timestamp"].dt.floor("min")
        
        agg = (
            df.groupby(["category", "bucket"])
            .size()
            .reset_index(name="count")
        )
        agg.rename(columns={"bucket": "hour"}, inplace=True)
        
        print(f"📊 Aggregated into {len(agg)} time buckets")
        
        # Save aggregated data
        csv_path = "data/events.csv"
        agg.to_csv(csv_path, index=False)
        print(f"✅ Saved aggregated data to {csv_path}")
        
        return csv_path, raw_events_df
        
    except Exception as e:
        print(f"❌ Error refreshing events: {e}")
        traceback.print_exc()
        return None, None


@app.post("/detect-trends")
def detect_and_store_trends():
    """
    Enhanced trend detection with comprehensive analytics
    """
    try:
        print("\n" + "="*60)
        print("🔍 STARTING ENHANCED TREND DETECTION")
        print("="*60)
        
        # 1. REFRESH DATA (get both aggregated and raw)
        csv_path, raw_events_df = refresh_events_data()
        
        if not csv_path or raw_events_df is None:
            return {
                "message": "No data available for trend detection",
                "count": 0,
                "trends": []
            }
        
        # 2. RUN ENHANCED DETECTION
        print("\n🔍 Running enhanced trend detection...")
        results = detect_trends(csv_path, events_data=raw_events_df)
        
        if not results:
            print("⚠️ No significant trends detected")
            return {
                "message": "No significant trends detected",
                "count": 0,
                "trends": []
            }
        
        print(f"\n✅ Detected {len(results)} significant trends")
        
        # 3. PREPARE FOR DATABASE STORAGE
        now = datetime.now(timezone.utc)
        
        db_trends = []
        for trend in results:
            db_trend = {
                # Core metrics
                "category": trend["category"],
                "spikeScore": float(trend["spikeScore"]),
                "currentCount": int(trend["currentCount"]),
                "baselineCount": float(trend["baselineCount"]),
                "percentIncrease": float(trend["percentIncrease"]),
                
                # Severity and direction
                "severity": trend["severity"],
                "trendDirection": trend["trendDirection"],
                
                # Temporal
                "detectedAt": datetime.fromisoformat(trend["detectedAt"].replace('Z', '+00:00')),
                "windowStart": datetime.fromisoformat(trend["windowStart"]),
                "windowEnd": datetime.fromisoformat(trend["windowEnd"]),
                "windowDuration": trend["windowDuration"],
                
                # Samples
                "sampleTexts": trend["sampleTexts"][:5],  # Limit to 5
                "topSources": trend["topSources"],
                
                # Comparison
                "comparisonPeriod": trend["comparisonPeriod"],
                
                # Status
                "isActive": True,
                "createdAt": now
            }
            
            db_trends.append(db_trend)
            
            # Print summary
            print(format_trend_summary(trend))
        
        # 4. STORE IN DATABASE
        # Clear old trends
        delete_result = trends_col.delete_many({})
        print(f"\n🗑️ Cleared {delete_result.deleted_count} old trends")
        
        # Insert new trends
        if db_trends:
            insert_result = trends_col.insert_many(db_trends)
            print(f"💾 Stored {len(insert_result.inserted_ids)} trends in database")
        
        # 5. PREPARE API RESPONSE (serialize for JSON)
        response_trends = []
        for trend in db_trends:
            trend_copy = trend.copy()
            
            # Convert ObjectId to string if present
            if "_id" in trend_copy:
                trend_copy["_id"] = str(trend_copy["_id"])
            
            # Convert datetime objects to ISO strings
            for key, value in trend_copy.items():
                if isinstance(value, datetime):
                    trend_copy[key] = value.isoformat()
            
            response_trends.append(trend_copy)
        
        # 6. VERIFY STORAGE
        stored_count = trends_col.count_documents({})
        print(f"✅ Verified: {stored_count} active trends in database")
        
        print("\n" + "="*60)
        print(f"✅ TREND DETECTION COMPLETE")
        print(f"   {len(response_trends)} trends detected and stored")
        print("="*60 + "\n")
        
        return {
            "message": "Enhanced trend detection complete",
            "count": len(response_trends),
            "trends": response_trends,
            "summary": {
                "critical": sum(1 for t in results if t["severity"] == "CRITICAL"),
                "high": sum(1 for t in results if t["severity"] == "HIGH"),
                "medium": sum(1 for t in results if t["severity"] == "MEDIUM"),
                "low": sum(1 for t in results if t["severity"] == "LOW"),
            }
        }
    
    except Exception as e:
        print(f"❌ Error in trend detection: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    """Enhanced health check with detailed stats"""
    try:
        client.admin.command('ping')
        
        # Get stats
        event_count = events_col.count_documents({})
        trend_count = trends_col.count_documents({})
        active_trends = trends_col.count_documents({"isActive": True})
        
        # Get severity breakdown
        severity_stats = {}
        for severity in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            severity_stats[severity.lower()] = trends_col.count_documents(
                {"severity": severity, "isActive": True}
            )
        
        return {
            "status": "healthy",
            "mongodb": "connected",
            "database": "medithon",
            "stats": {
                "total_events": event_count,
                "total_trends": trend_count,
                "active_trends": active_trends,
                "severity_breakdown": severity_stats
            },
            "collections": db.list_collection_names()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.get("/debug/events")
def debug_events():
    """Debug endpoint - see sample events with full data"""
    try:
        events = list(events_col.find().limit(3))
        for e in events:
            e["_id"] = str(e["_id"])
            # Convert datetime objects
            for key, value in e.items():
                if isinstance(value, datetime):
                    e[key] = value.isoformat()
        
        return {
            "count": events_col.count_documents({}),
            "sample_events": events,
            "available_fields": list(events[0].keys()) if events else []
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/trends")
def debug_trends():
    """Debug endpoint - see sample trends with full data"""
    try:
        trends = list(trends_col.find().limit(3))
        for t in trends:
            t["_id"] = str(t["_id"])
            # Convert datetime objects
            for key, value in t.items():
                if isinstance(value, datetime):
                    t[key] = value.isoformat()
        
        return {
            "count": trends_col.count_documents({}),
            "active_count": trends_col.count_documents({"isActive": True}),
            "sample_trends": trends,
            "available_fields": list(trends[0].keys()) if trends else []
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Enhanced Trend Detection API on http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)