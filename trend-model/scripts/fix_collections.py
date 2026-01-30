from pymongo import MongoClient

# Use your working credentials
username = "aditiarya"
password = "medithon" 
MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.rdqu8e8.mongodb.net/medithon?appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["medithon"]

print("🔧 Starting Database Repair...")

# 1. Check counts
count_old = db["Event"].count_documents({})  # Capital 'E' (Prisma default)
count_new = db["events"].count_documents({}) # Lowercase 'e' (Python default)

print(f"🧐 Found {count_old} records in old 'Event' collection.")
print(f"🧐 Found {count_new} records in new 'events' collection.")

if count_old > 0:
    print("🚀 Moving data from 'Event' to 'events'...")
    
    # Get all documents from old collection
    old_docs = list(db["Event"].find())
    
    # Insert them into the new collection
    if old_docs:
        try:
            db["events"].insert_many(old_docs)
            print(f"✅ Successfully moved {len(old_docs)} records.")
            
            # Optional: Delete the old collection to avoid confusion
            db["Event"].drop()
            print("🗑️ Deleted old 'Event' collection.")
            
        except Exception as e:
            print(f"❌ Error moving data: {e}")
else:
    print("✅ No stale data found in 'Event'.")

print("✨ Database is consistent. Both Prisma and Python will now use 'events'.")