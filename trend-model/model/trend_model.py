import pandas as pd

# ----------------------------
# CONFIG
# ----------------------------
WINDOW_SIZE = 2        # how many previous points to average
SPIKE_THRESHOLD = 1.2  # spike if current > avg * threshold


def detect_trends(csv_path):
    """
    Reads aggregated event data and detects abnormal spikes.
    Returns a list of detected trends.
    """

    df = pd.read_csv(csv_path)

    if df.empty:
        print("❌ events.csv is empty")
        return []

    results = []

    # process each category separately
    for category in df["category"].unique():
        cat_df = df[df["category"] == category].copy()
        cat_df = cat_df.sort_values("hour")

        if len(cat_df) < WINDOW_SIZE + 1:
            # not enough data to detect trends
            continue

        # rolling mean
        cat_df["rolling_mean"] = (
            cat_df["count"]
            .rolling(window=WINDOW_SIZE)
            .mean()
        )

        # spike score
        cat_df["spike_score"] = cat_df["count"] / cat_df["rolling_mean"]

        latest = cat_df.iloc[-1]

        if latest["spike_score"] > SPIKE_THRESHOLD:
            results.append({
                "category": category,
                "current_count": int(latest["count"]),
                "baseline": round(latest["rolling_mean"], 2),
                "spike_score": round(latest["spike_score"], 2),
                "hour": latest["hour"]
            })

    return results
