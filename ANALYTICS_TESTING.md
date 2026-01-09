# Analytics System Testing Guide

## Quick Test Commands

### 1. Test Event Tracking

```bash
# Track a pageview event
curl -X POST http://localhost:8000/api/v1/analytics/track/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "event_type": "pageview",
    "session_id": "test_session_123",
    "visitor_id": "test_visitor_456",
    "url": "https://mystore.com/products/cool-shoes",
    "path": "/products/cool-shoes",
    "referrer": "https://google.com",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "viewport_width": 1920,
    "viewport_height": 1080,
    "screen_width": 1920,
    "screen_height": 1080,
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer_sale",
    "consent_given": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "event_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Track Ecommerce Event

```bash
# Track an add-to-cart event
curl -X POST http://localhost:8000/api/v1/analytics/track/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "event_type": "ecommerce",
    "event_name": "add_to_cart",
    "session_id": "test_session_123",
    "visitor_id": "test_visitor_456",
    "url": "https://mystore.com/products/cool-shoes",
    "path": "/products/cool-shoes",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    "ecommerce": {
      "product_id": "shoe_123",
      "product_name": "Cool Shoes",
      "product_price": 99.99,
      "product_quantity": 1,
      "cart_value": 99.99,
      "funnel_step": "add_to_cart"
    },
    "viewport_width": 375,
    "viewport_height": 812,
    "consent_given": true
  }'
```

### 3. Track Performance Metrics

```bash
# Track Web Vitals
curl -X POST http://localhost:8000/api/v1/analytics/track/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "event_type": "performance",
    "session_id": "test_session_123",
    "visitor_id": "test_visitor_456",
    "url": "https://mystore.com/",
    "path": "/",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "performance": {
      "lcp": 1.2,
      "fid": 0.05,
      "cls": 0.01,
      "ttfb": 0.3,
      "fcp": 0.8,
      "dom_load_time": 1.5,
      "window_load_time": 2.1
    },
    "viewport_width": 1366,
    "viewport_height": 768,
    "consent_given": true
  }'
```

### 4. Batch Event Tracking

```bash
# Send multiple events at once
curl -X POST http://localhost:8000/api/v1/analytics/track/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "events": [
      {
        "event_type": "pageview",
        "session_id": "test_session_789",
        "visitor_id": "test_visitor_789",
        "url": "https://mystore.com/",
        "path": "/",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "viewport_width": 1920,
        "viewport_height": 1080,
        "consent_given": true
      },
      {
        "event_type": "click",
        "session_id": "test_session_789",
        "visitor_id": "test_visitor_789",
        "url": "https://mystore.com/",
        "path": "/",
        "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "properties": {
          "element": "button",
          "text": "Shop Now",
          "x": 500,
          "y": 300
        },
        "viewport_width": 1920,
        "viewport_height": 1080,
        "consent_given": true
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "processed": 2,
  "failed": 0,
  "errors": null
}
```

### 5. Get Analytics Summary

```bash
# Get summary for last 7 days
curl "http://localhost:8000/api/v1/analytics/summary?date_from=2026-01-01T00:00:00Z&date_to=2026-01-07T23:59:59Z" \
  -H "X-API-Key: test-key"
```

**Expected Response:**
```json
{
  "date_from": "2026-01-01T00:00:00Z",
  "date_to": "2026-01-07T23:59:59Z",
  "total_pageviews": 1234,
  "total_visitors": 567,
  "total_sessions": 890,
  "avg_session_duration": 125.5,
  "bounce_rate": 45.2,
  "conversion_rate": 3.4,
  "total_revenue": 12345.67,
  "top_pages": [
    {
      "path": "/products/cool-shoes",
      "pageviews": 456,
      "unique_visitors": 234
    }
  ],
  "top_referrers": [
    {
      "referrer": "google.com",
      "visits": 123
    }
  ],
  "top_countries": [
    {
      "country_code": "US",
      "country_name": "United States",
      "visitors": 345
    }
  ],
  "device_breakdown": {
    "desktop": 400,
    "mobile": 300,
    "tablet": 100
  }
}
```

### 6. Get Real-time Stats

```bash
# Get live traffic stats
curl "http://localhost:8000/api/v1/analytics/realtime" \
  -H "X-API-Key: test-key"
```

**Expected Response:**
```json
{
  "current_visitors": 5,
  "visitors_last_5min": 12,
  "pageviews_last_5min": 34,
  "top_pages_now": [
    {
      "path": "/products/cool-shoes",
      "visitors": 3
    }
  ],
  "top_countries_now": [
    {
      "country_code": "US",
      "visitors": 4
    }
  ],
  "recent_conversions": [
    {
      "type": "purchase",
      "value": 99.99,
      "timestamp": "2026-01-07T12:34:56Z"
    }
  ]
}
```

## Load Testing

### Generate Test Data

```bash
# Python script to generate realistic test data
python << 'EOF'
import requests
import random
import time
from datetime import datetime

API_URL = "http://localhost:8000/api/v1/analytics/track/event"
API_KEY = "test-key"

paths = ["/", "/products", "/products/shoes", "/cart", "/checkout", "/thank-you"]
referrers = ["google.com", "facebook.com", "instagram.com", "direct", None]
devices = ["desktop", "mobile", "tablet"]

for i in range(100):  # Generate 100 events
    event = {
        "event_type": "pageview",
        "session_id": f"session_{random.randint(1, 20)}",
        "visitor_id": f"visitor_{random.randint(1, 50)}",
        "url": f"https://mystore.com{random.choice(paths)}",
        "path": random.choice(paths),
        "referrer": f"https://{random.choice(referrers)}" if random.choice(referrers) else None,
        "user_agent": "Mozilla/5.0 (Test Bot)",
        "device_type": random.choice(devices),
        "viewport_width": random.choice([375, 768, 1024, 1920]),
        "viewport_height": random.choice([667, 1024, 768, 1080]),
        "consent_given": True
    }

    response = requests.post(
        API_URL,
        json=event,
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"}
    )

    print(f"Event {i+1}: {response.status_code}")
    time.sleep(0.1)  # Rate limit

print("✅ Test data generated!")
EOF
```

## Database Verification

```sql
-- Check event counts
SELECT COUNT(*) as total_events FROM analytics_events;

-- Check by event type
SELECT event_type, COUNT(*) as count
FROM analytics_events
GROUP BY event_type
ORDER BY count DESC;

-- Check unique visitors
SELECT COUNT(DISTINCT visitor_id) as unique_visitors
FROM analytics_events;

-- Check session metrics
SELECT
    COUNT(*) as total_sessions,
    AVG(duration_seconds) as avg_duration,
    AVG(pageview_count) as avg_pageviews
FROM analytics_sessions;

-- Top pages
SELECT path, COUNT(*) as pageviews
FROM analytics_events
WHERE event_type = 'pageview'
GROUP BY path
ORDER BY pageviews DESC
LIMIT 10;
```

## Frontend Testing

### Test SDK Integration

Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Analytics Test Page</title>
</head>
<body>
    <h1>Analytics Test Page</h1>
    <button id="testBtn">Click Me</button>
    <button onclick="trackCustom()">Custom Event</button>

    <!-- Load Analytics SDK -->
    <script
        src="http://localhost:3000/analytics-sdk.js"
        data-api-key="test-key"
        data-api-url="http://localhost:8000/api/v1/analytics"
        data-auto-track="true"
    ></script>

    <script>
        function trackCustom() {
            ecomDashAnalytics.event('button_clicked', {
                button_name: 'Custom Event',
                timestamp: Date.now()
            });
            alert('Custom event tracked!');
        }

        // Track ecommerce event
        setTimeout(() => {
            ecomDashAnalytics.trackEcommerce('add_to_cart', {
                product_id: 'test_123',
                product_price: 49.99
            });
            console.log('Ecommerce event tracked!');
        }, 2000);
    </script>
</body>
</html>
```

Open in browser and check:
1. Browser console for SDK initialization
2. Network tab for API calls to `/track/batch`
3. Backend logs for received events

## Performance Benchmarks

### Expected Performance

- **Event Ingestion**: 10,000 events/second per instance
- **Query Latency**: p95 < 100ms for summary queries
- **Real-time Delay**: < 500ms from event to dashboard
- **SDK Size**: ~2KB gzipped
- **Memory per Event**: ~1KB

### Measure Performance

```bash
# Use Apache Bench for load testing
ab -n 1000 -c 10 -p event.json -T application/json \
   -H "X-API-Key: test-key" \
   http://localhost:8000/api/v1/analytics/track/event
```

Where `event.json` contains a sample event payload.

## Troubleshooting

### Events Not Appearing

1. **Check logs:**
   ```bash
   tail -f backend/logs/app.log
   ```

2. **Verify database connection:**
   ```bash
   psql -d ecomdash -c "SELECT COUNT(*) FROM analytics_events;"
   ```

3. **Check API response:**
   ```bash
   curl -v http://localhost:8000/api/v1/analytics/realtime
   ```

### SDK Not Loading

1. **Check CORS headers** in backend
2. **Verify script URL** is accessible
3. **Check browser console** for errors
4. **Inspect Network tab** for failed requests

### Slow Queries

1. **Check indexes:**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'analytics_events';
   ```

2. **Analyze query plans:**
   ```sql
   EXPLAIN ANALYZE
   SELECT COUNT(*) FROM analytics_events
   WHERE timestamp >= NOW() - INTERVAL '7 days';
   ```

3. **Consider partitioning** by date for large tables

## Next Steps

Once basic testing is complete:

1. ✅ Verify all endpoints work
2. ✅ Generate realistic test data
3. ✅ Check dashboard displays data correctly
4. ⏳ Implement GeoIP enrichment
5. ⏳ Add session replay
6. ⏳ Migrate to ClickHouse for scale

---

Happy Testing! 🚀
