from model.trend_model import detect_trends

CSV_PATH = "data/events.csv"

print("🔍 Running trend detection...\n")

trends = detect_trends(CSV_PATH)

if not trends:
    print("✅ No abnormal trends detected")
else:
    print("🚨 Abnormal trends detected:\n")
    for t in trends:
        print(
            f"- Category: {t['category']}\n"
            f"  Count: {t['current_count']}\n"
            f"  Baseline: {t['baseline']}\n"
            f"  Spike Score: {t['spike_score']}x\n"
            f"  Time: {t['hour']}\n"
        )
