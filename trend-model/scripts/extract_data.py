import pandas as pd
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["pharmaradar"]
events_col = db["events"]

events = list(events_col.find())

if not events:
    print("❌ No events found in DB")
    exit()

df = pd.DataFrame(events)
print("🧪 Available columns:", df.columns)

# 🔴 CRITICAL: ensure timestamp exists
df["timestamp"] = pd.to_datetime(df["timestamp"])

# ✅ MINUTE-LEVEL BUCKETING
df["bucket"] = df["timestamp"].dt.floor("min")

agg = (
    df.groupby(["category", "bucket"])
      .size()
      .reset_index(name="count")
)

agg.rename(columns={"bucket": "hour"}, inplace=True)

agg.to_csv("data/events.csv", index=False)

print("✅ events.csv regenerated")
print(agg)
