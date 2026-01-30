from pymongo import MongoClient

# Use your working credentials
username = "aditiarya"
password = "medithon" 
MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.rdqu8e8.mongodb.net/medithon?appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["medithon"]

print("🔍 Inspecting 'trends' collection...")

trends = list(db["trends"].find())

if not trends:
    print("❌ Collection is EMPTY. Run your detection logic again.")
else:
    print(f"✅ Found {len(trends)} records. Here is the first one:")
    print("---------------------------------------------------")
    t = trends[0]
    print(f"ID: {t.get('_id')} (Type: {type(t.get('_id'))})")
    print(f"Category: '{t.get('category')}'") 
    print(f"SpikeScore: {t.get('spikeScore')} (Type: {type(t.get('spikeScore'))})")
    print(f"Window: '{t.get('window')}'")
    print(f"SampleTexts: {t.get('sampleTexts')} (Type: {type(t.get('sampleTexts'))})")
    print("---------------------------------------------------")
    
    # Check for Enum Mismatch
    valid_enums = ["BRAND_PERCEPTION", "SIDE_EFFECTS", "COMPETITOR_ACTIVITY", "REGULATION_POLICY", "CLINICAL_TRIALS", "MARKETING_PROMOTION"]
    if t.get('category') not in valid_enums:
        print(f"⚠️ CRITICAL WARNING: Category '{t.get('category')}' is NOT in your Prisma Enum list!")
    else:
        print("✅ Category matches Prisma Enum.")