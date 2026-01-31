"""
Enhanced Trend Detection Model with Comprehensive Analytics
"""
import pandas as pd
from datetime import datetime, timedelta

# ----------------------------
# CONFIGURATION
# ----------------------------
WINDOW_SIZE = 4           # Compare against 4 previous time periods
SPIKE_THRESHOLDS = {
    'LOW': 1.2,           # 20% increase
    'MEDIUM': 1.5,        # 50% increase
    'HIGH': 2.0,          # 100% increase (2x)
    'CRITICAL': 3.0       # 200% increase (3x)
}


def calculate_severity(spike_score):
    """Classify trend severity based on spike score"""
    if spike_score >= SPIKE_THRESHOLDS['CRITICAL']:
        return 'CRITICAL'
    elif spike_score >= SPIKE_THRESHOLDS['HIGH']:
        return 'HIGH'
    elif spike_score >= SPIKE_THRESHOLDS['MEDIUM']:
        return 'MEDIUM'
    elif spike_score >= SPIKE_THRESHOLDS['LOW']:
        return 'LOW'
    else:
        return None


def calculate_trend_direction(spike_score, historical_scores):
    """Determine if trend is surging, spiking, or elevated"""
    if spike_score >= 3.0:
        return 'surging'
    elif spike_score >= 2.0:
        return 'spiking'
    elif spike_score >= 1.5:
        return 'elevated'
    elif len(historical_scores) > 0 and spike_score < historical_scores[-1]:
        return 'declining'
    else:
        return 'stable'


def get_sample_events(category, events_df, limit=5):
    """Get sample event texts for a specific category"""
    category_events = events_df[events_df['category'] == category]
    
    # Sort by timestamp (most recent first) and get samples
    if not category_events.empty:
        samples = category_events.nlargest(limit, 'timestamp')['text'].tolist()
        return samples[:limit]
    return []


def get_top_sources(category, events_df, limit=3):
    """Get top contributing sources for a category"""
    category_events = events_df[events_df['category'] == category]
    
    if category_events.empty:
        return []
    
    # Count by source
    source_counts = category_events['source'].value_counts().head(limit)
    
    # Format as list of dicts
    return [
        {"source": source, "count": int(count)} 
        for source, count in source_counts.items()
    ]


def detect_trends(csv_path, events_data=None):
    """
    Enhanced trend detection with comprehensive analytics.
    
    Args:
        csv_path: Path to aggregated events CSV
        events_data: Optional - raw events DataFrame for sampling
    
    Returns:
        List of detected trends with rich metadata
    """
    
    print("\n" + "="*60)
    print("🔍 ENHANCED TREND DETECTION")
    print("="*60)
    
    # Read aggregated data
    df = pd.read_csv(csv_path)
    
    if df.empty:
        print("❌ No data available for trend detection")
        return []
    
    print(f"📊 Analyzing {len(df)} aggregated data points")
    print(f"📅 Categories found: {df['category'].unique().tolist()}")
    
    results = []
    
    # Process each category
    for category in df["category"].unique():
        cat_df = df[df["category"] == category].copy()
        cat_df = cat_df.sort_values("hour")
        
        if len(cat_df) < WINDOW_SIZE + 1:
            print(f"⚠️ {category}: Insufficient data (need {WINDOW_SIZE + 1} points, have {len(cat_df)})")
            continue
        
        # Calculate rolling statistics
        cat_df["rolling_mean"] = cat_df["count"].rolling(window=WINDOW_SIZE).mean()
        cat_df["rolling_std"] = cat_df["count"].rolling(window=WINDOW_SIZE).std()
        cat_df["spike_score"] = cat_df["count"] / cat_df["rolling_mean"]
        
        # Get latest data point
        latest = cat_df.iloc[-1]
        spike_score = latest["spike_score"]
        
        # Determine severity
        severity = calculate_severity(spike_score)
        
        if severity is None:
            continue  # No significant trend
        
        # Calculate metrics
        current_count = int(latest["count"])
        baseline_count = latest["rolling_mean"]
        percent_increase = ((current_count - baseline_count) / baseline_count) * 100
        
        # Get historical spike scores for trend direction
        historical_scores = cat_df["spike_score"].tail(3).tolist()
        trend_direction = calculate_trend_direction(spike_score, historical_scores)
        
        # Time window information
        window_end = pd.to_datetime(latest["hour"])
        window_start = window_end - timedelta(hours=2)  # Based on your 2-hour scheduler
        
        # Get sample events and top sources (if events_data provided)
        sample_texts = []
        top_sources = []
        
        if events_data is not None:
            sample_texts = get_sample_events(category, events_data, limit=5)
            top_sources = get_top_sources(category, events_data, limit=3)
        
        trend = {
            # Core metrics
            "category": category,
            "spikeScore": round(float(spike_score), 2),
            "currentCount": current_count,
            "baselineCount": round(float(baseline_count), 2),
            "percentIncrease": round(float(percent_increase), 1),
            
            # Severity and direction
            "severity": severity,
            "trendDirection": trend_direction,
            
            # Temporal information
            "windowStart": window_start.isoformat(),
            "windowEnd": window_end.isoformat(),
            "windowDuration": "2h",
            "detectedAt": datetime.now().isoformat(),
            
            # Sample data
            "sampleTexts": sample_texts,
            "topSources": top_sources,
            
            # Comparison
            "comparisonPeriod": f"vs last {WINDOW_SIZE * 2}h average",
            
            # Status
            "isActive": True
        }
        
        results.append(trend)
        
        print(f"\n🚨 TREND DETECTED: {category}")
        print(f"   Severity: {severity}")
        print(f"   Spike: {spike_score:.2f}x ({percent_increase:.1f}% increase)")
        print(f"   Current: {current_count} events vs baseline {baseline_count:.1f}")
        print(f"   Direction: {trend_direction}")
        if top_sources:
            print(f"   Top Sources: {', '.join([s['source'] for s in top_sources])}")
    
    print("\n" + "="*60)
    print(f"✅ Detection Complete: {len(results)} trends identified")
    print("="*60 + "\n")
    
    return results


def format_trend_summary(trend):
    """Generate a human-readable summary of a trend"""
    category = trend['category'].replace('_', ' ').title()
    severity_emoji = {
        'LOW': '🟡',
        'MEDIUM': '🟠',
        'HIGH': '🔴',
        'CRITICAL': '🚨'
    }
    
    emoji = severity_emoji.get(trend['severity'], '⚠️')
    trend_severity = trend['severity']  # FIX: Get severity from trend dict
    
    summary = (
        f"{emoji} {trend_severity} Alert: {category}\n"
        f"   {trend['currentCount']} events detected "
        f"({trend['percentIncrease']:.0f}% above baseline)\n"
        f"   Trend is {trend['trendDirection']} "
        f"({trend['spikeScore']:.1f}x normal activity)"
    )
    
    return summary