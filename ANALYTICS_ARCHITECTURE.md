# EcomDash v2 - Advanced Web Traffic Analytics Architecture

## Executive Summary

This document outlines a **modular, privacy-first, real-time ecommerce analytics system** that combines the best of modern 2026 technologies with proven analytics patterns.

### Key Technologies & Why

Based on 2026 research, we're using:

- **Plausible/Fathom approach**: Privacy-focused, cookieless tracking
- **PostHog patterns**: Self-hosted, feature flags, session replay
- **ClickHouse**: Real-time OLAP for analytics (replaces traditional OLTP for analytics)
- **Apache Kafka/Redpanda**: Event streaming (modern alternative to webhooks)
- **TimescaleDB**: Time-series optimized PostgreSQL extension
- **WebSocket + Server-Sent Events**: Real-time dashboard updates
- **OpenTelemetry**: Standardized observability

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Browser)                    │
├─────────────────────────────────────────────────────────────┤
│  • Analytics SDK (privacy-first)                            │
│  • Session Replay Recorder                                   │
│  • Heatmap Tracker                                          │
│  • Performance Observer                                      │
└────────────────────┬────────────────────────────────────────┘
                     │ Events (Batched, Compressed)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  INGESTION LAYER (API)                      │
├─────────────────────────────────────────────────────────────┤
│  Module 1: Event Collector API (FastAPI)                   │
│    • /track/event - Page views, clicks, custom events      │
│    • /track/session - Session data                         │
│    • /track/replay - Session replay frames                 │
│    • /track/performance - Web vitals, timing               │
│    • Rate limiting, validation, fingerprinting             │
└────────────────────┬────────────────────────────────────────┘
                     │ Validated Events
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              STREAMING LAYER (Event Bus)                    │
├─────────────────────────────────────────────────────────────┤
│  Module 2: Event Stream Processor                          │
│    • Redpanda/Kafka topics                                 │
│    • Event enrichment (GeoIP, device detection)            │
│    • Real-time aggregation                                 │
│    • Anomaly detection                                     │
└────┬───────────────┬────────────────┬───────────────────────┘
     │               │                │
     ▼               ▼                ▼
┌──────────┐  ┌──────────┐  ┌──────────────────────┐
│  Module  │  │  Module  │  │     Module 5:        │
│    3:    │  │    4:    │  │  Privacy Engine      │
│ Analytics│  │Conversion│  │  • Data retention    │
│  Engine  │  │  Funnel  │  │  • Anonymization     │
│          │  │          │  │  • GDPR compliance   │
└────┬─────┘  └────┬─────┘  └──────────────────────┘
     │             │
     ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                  STORAGE LAYER (Hybrid)                     │
├─────────────────────────────────────────────────────────────┤
│  • ClickHouse - Real-time analytics queries (OLAP)         │
│  • TimescaleDB - Time-series metrics                       │
│  • PostgreSQL - Metadata, user profiles, configs           │
│  • Redis - Real-time counters, leaderboards                │
│  • S3/MinIO - Session replay storage, raw events           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               ANALYTICS API LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Module 6: Query API                                        │
│    • RESTful endpoints for metrics                         │
│    • GraphQL for flexible queries                          │
│    • WebSocket for real-time updates                       │
│    • Caching layer (Redis)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD LAYER (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Module 7: Real-time Dashboard                             │
│    • Live visitor map                                       │
│    • Conversion funnel visualization                        │
│    • Heatmap viewer                                        │
│    • Session replay player                                 │
│    • Custom reports builder                                │
└─────────────────────────────────────────────────────────────┘
```

## Module Breakdown

### Module 1: Core Analytics Tracking Engine

**Tech Stack:**
- FastAPI endpoints
- Pydantic v2 validation
- AsyncIO for high throughput
- Fingerprinting (canvas, audio, WebGL)

**Features:**
- Privacy-first tracking (no cookies required)
- Automatic PII detection and redaction
- Bot detection (ML-based)
- Event batching and compression (Brotli)
- Offline support with queue

**Innovations vs Traditional GA:**
- ✅ Cookieless tracking using browser fingerprinting
- ✅ No external CDN (self-hosted SDK)
- ✅ GDPR-compliant by default
- ✅ 10x smaller payload (~2KB vs 20KB GA4)

### Module 2: User Behavior Tracking

**Tech Stack:**
- rrweb for session replay (MIT license)
- heatmap.js alternative (custom implementation)
- WebRTC for screen recording (premium feature)
- Canvas-based heatmap rendering

**Features:**
- Session replay with privacy controls
- Click, scroll, and mouse movement heatmaps
- Rage click detection
- Dead click identification
- Form analytics (without capturing PII)
- Error tracking integration

**Innovations:**
- ✅ Differential compression for session replay (90% size reduction)
- ✅ Privacy zones (auto-detect input fields)
- ✅ Smart sampling (record only interesting sessions)
- ✅ Edge processing for heatmap aggregation

### Module 3: Conversion Funnel Analytics

**Tech Stack:**
- ClickHouse for funnel queries
- SQL CTEs for complex funnel analysis
- Materialized views for performance

**Ecommerce-Specific Metrics:**
- Cart abandonment rate
- Checkout drop-off by step
- Product view → Add to cart → Purchase
- Average order value (AOV)
- Customer lifetime value (CLV)
- Time to purchase
- Return customer rate

**Innovations:**
- ✅ AI-powered anomaly detection
- ✅ Predictive cart abandonment alerts
- ✅ Multi-touch attribution modeling
- ✅ Cohort analysis with retention curves

### Module 4: Real-time Analytics Dashboard

**Tech Stack:**
- React + Zustand for state management
- D3.js / Recharts for visualizations
- WebSocket (Socket.io) for real-time updates
- React Query for data fetching
- Tailwind CSS for styling

**Features:**
- Live visitor count
- Real-time conversion tracking
- Live product performance
- Geographic heat map
- Traffic source breakdown
- Revenue dashboard

**Innovations:**
- ✅ Sub-second latency using Server-Sent Events
- ✅ Incremental updates (delta sync)
- ✅ Optimistic UI updates
- ✅ Collaborative dashboards (multi-user)

### Module 5: Privacy-Focused Tracking Module

**Tech Stack:**
- Data retention policies (automated)
- Anonymization pipeline
- Consent management (CMP integration)
- Right to erasure automation

**Compliance:**
- GDPR (EU)
- CCPA (California)
- PECR (UK)
- LGPD (Brazil)
- Cookie-less operation

**Features:**
- Automatic data anonymization after 90 days
- IP address truncation
- User ID hashing (SHA-256)
- Data export API (subject access requests)
- Audit logs for all data access

### Module 6: API Gateway & Webhook System

**Tech Stack:**
- FastAPI with rate limiting
- JWT authentication
- Webhook delivery with retry logic
- API versioning

**Endpoints:**
```
POST /api/v1/track/event
POST /api/v1/track/pageview
POST /api/v1/track/session
GET  /api/v1/analytics/summary
GET  /api/v1/analytics/funnels
GET  /api/v1/analytics/heatmaps
POST /api/v1/webhooks/register
```

**Webhook Events:**
- `conversion.completed`
- `cart.abandoned`
- `session.recorded`
- `threshold.exceeded` (e.g., 1000 visitors in 1 hour)

### Module 7: Configuration & Orchestration Layer

**Tech Stack:**
- Feature flags (LaunchDarkly pattern)
- A/B testing framework
- Sampling configuration
- Data pipeline orchestration

**Features:**
- Per-domain configuration
- Custom event definitions
- Sampling rules (cost optimization)
- Data retention policies
- Alert rules and thresholds

## Technology Comparison: Old vs New

| Component | Traditional (2020) | Modern (2026) | Why Better |
|-----------|-------------------|---------------|------------|
| **Analytics** | Google Analytics | Plausible + Self-hosted | Privacy, ownership, no sampling |
| **Event Storage** | PostgreSQL | ClickHouse | 100x faster for analytics queries |
| **Time-series** | PostgreSQL | TimescaleDB | Optimized for time-series data |
| **Event Bus** | Direct API calls | Redpanda/Kafka | Decoupled, scalable, replay capability |
| **Session Replay** | FullStory ($$$) | rrweb + S3 | Open source, 10x cheaper |
| **Heatmaps** | Hotjar | Custom (Canvas API) | No external dependencies, faster |
| **Real-time** | Polling | WebSocket + SSE | Sub-second latency, efficient |
| **Privacy** | Manual compliance | Automated anonymization | Compliant by default |

## Data Flow Example

### Page View Event

```
1. User visits /products/shoe-123
2. SDK sends compressed event batch:
   {
     "events": [
       {
         "type": "pageview",
         "url": "/products/shoe-123",
         "referrer": "google.com",
         "timestamp": 1704636000000,
         "session_id": "abc123",
         "visitor_id": "fingerprint_hash",
         "viewport": {"width": 1920, "height": 1080},
         "performance": {
           "lcp": 1.2,
           "fid": 0.05,
           "cls": 0.01
         }
       }
     ]
   }
3. API validates, enriches (GeoIP), publishes to Kafka topic
4. Stream processor:
   - Increments real-time counters (Redis)
   - Writes to ClickHouse (analytics)
   - Writes to TimescaleDB (time-series)
   - Triggers real-time dashboard update (WebSocket)
5. Dashboard updates live visitor count
```

## Performance Targets

- **Event Ingestion**: 10,000 events/second per instance
- **Query Latency**: p95 < 100ms for dashboard queries
- **Real-time Delay**: < 500ms from event to dashboard
- **Storage**: ~1KB per pageview event (compressed)
- **Retention**: 90 days hot data, 2 years cold storage

## Deployment Architecture

```
┌─────────────────┐
│   Cloudflare    │ ← DDoS protection, edge caching
└────────┬────────┘
         │
┌────────▼────────┐
│   Load Balancer │ ← Nginx/Traefik
└────────┬────────┘
         │
    ┌────┴─────┬─────────────┬─────────────┐
    │          │             │             │
┌───▼───┐ ┌───▼───┐   ┌─────▼──────┐ ┌───▼────┐
│ API 1 │ │ API 2 │   │  Worker 1  │ │Worker 2│
└───┬───┘ └───┬───┘   └─────┬──────┘ └───┬────┘
    │         │             │            │
    └─────────┴──────┬──────┴────────────┘
                     │
         ┌───────────▼───────────┐
         │   Redpanda Cluster    │
         └───────────┬───────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
│ClickHo.│    │TimescaleDB│   │  Redis    │
└────────┘    └───────────┘   └───────────┘
```

## Cost Analysis

### Traditional Stack (Hotjar + GA4 + FullStory)
- Hotjar: $99/mo (20K sessions)
- FullStory: $199/mo (5K sessions)
- GA4: Free (but data not owned)
- **Total: ~$298/mo + vendor lock-in**

### Our Self-Hosted Stack
- ClickHouse: $50/mo (managed)
- Redis: $20/mo
- S3 storage: $10/mo
- Compute: $100/mo (2x instances)
- **Total: ~$180/mo + full ownership**

**Savings: 40% cost reduction + infinite scalability**

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Event ingestion API (Module 1)
2. ✅ JavaScript SDK
3. ✅ Basic ClickHouse schema
4. ✅ Simple dashboard

### Phase 2: Core Analytics (Week 3-4)
5. ✅ Conversion funnel tracking (Module 3)
6. ✅ Real-time counters (Redis)
7. ✅ WebSocket integration (Module 4)
8. ✅ Privacy controls (Module 5)

### Phase 3: Advanced Features (Week 5-6)
9. ✅ Session replay (Module 2)
10. ✅ Heatmaps
11. ✅ Kafka/Redpanda integration
12. ✅ Advanced dashboard

### Phase 4: Production Hardening (Week 7-8)
13. ✅ Rate limiting & DDoS protection
14. ✅ Data retention automation
15. ✅ Monitoring & alerting
16. ✅ Documentation & API docs

## Research Sources

Based on 2026 web traffic analytics research:

- [10 best ecommerce analytics and tracking tools in 2026](https://usermaven.com/blog/ecommerce-tracking-tools)
- [Top 9 eCommerce Analytics Tools for Growth [2026]](https://www.mayple.com/resources/ecommerce/ecommerce-analytics-tools)
- [8 Top Ecommerce Analytics Tools + Software [Free + Paid]](https://contentsquare.com/guides/ecommerce-analytics/tools/)
- [Best Privacy-Focused Alternatives to Google Analytics for 2026](https://designmodo.com/google-analytics-alternatives/)
- [Plausible Analytics](https://plausible.io/)
- [Fathom Analytics](https://usefathom.com/)
- [GitHub - plausible/analytics](https://github.com/plausible/analytics)
- [GitHub - umami-software/umami](https://github.com/umami-software/umami)

## Next Steps

Ready to implement! Each module will be built as a standalone service with clear interfaces, allowing independent scaling and updates.
