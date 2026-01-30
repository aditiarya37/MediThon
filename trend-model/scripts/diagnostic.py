from pymongo import MongoClient
import urllib.parse

# --- CONFIGURATION ---
username = "aditiarya"
# PUT YOUR REAL RAW PASSWORD HERE (No %40, just the real characters)
password = "medithon"

# Auto-encode the password to fix the "bad auth" error
encoded_password = urllib.parse.quote_plus(password)

# Construct URI
MONGO_URI = f"mongodb+srv://{username}:{encoded_password}@cluster0.rdqu8e8.mongodb.net/medithon?appName=Cluster0"
DB_NAME = "medithon"  # Ensure this matches your Atlas Cluster folder name

print(f"🔌 Connecting to DB: {DB_NAME}...")

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Check connection
    client.admin.command('ping')
    print("✅ Connection Successful!")

    # Check Events
    event_count = db["events"].count_documents({})
    print(f"📊 Events Count: {event_count}")
    
    if event_count < 6:
        print("❌ CRITICAL ERROR: Not enough events. You MUST run the seed_remote.py script successfully.")
    else:
        print("✅ Sufficient events found.")

    # Check Trends
    trend_count = db["trends"].count_documents({})
    print(f"📈 Trends Count: {trend_count}")

except Exception as e:
    print(f"❌ CONNECTION FAILED: {e}")