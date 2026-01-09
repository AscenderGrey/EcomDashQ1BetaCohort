# APEX Analytics - Production Deployment Runbook

**Target:** Render.com (RetailOSBackend Account)
**System:** APEX Analytics MVP - AI-Native Shopify Analytics
**Deployment Date:** TBD
**Deployment Lead:** [Your Name]
**Estimated Duration:** 2-4 hours (first deployment)

---

## 🎯 Deployment Objectives

1. ✅ Zero-downtime production deployment
2. ✅ Database migration without data loss
3. ✅ Environment configuration and secrets management
4. ✅ Health monitoring and alerting
5. ✅ Performance validation (API <500ms, ML working)
6. ✅ Security hardening (HTTPS, rate limiting)
7. ✅ Rollback procedures tested and ready

---

## 📋 Pre-Deployment Checklist

### Code & Repository (15 minutes)

- [ ] **All code committed to GitHub**
  ```bash
  git status  # Should be clean
  git log -1  # Verify latest commit
  git push origin main  # Push to remote
  ```

- [ ] **All tests passing locally**
  ```bash
  cd backend
  source .venv/bin/activate
  pytest tests/  # Should be 100% pass
  ```

- [ ] **Database migrations ready**
  ```bash
  alembic check  # No pending migrations
  alembic current  # Shows current revision
  alembic upgrade --sql head > /tmp/migration_preview.sql  # Preview SQL
  cat /tmp/migration_preview.sql  # Review migration SQL
  ```

- [ ] **Environment variables documented**
  - [ ] SECRET_KEY generated (32+ characters)
  - [ ] ENCRYPTION_KEY generated (32+ characters)
  - [ ] SHOPIFY_API_KEY obtained (from Partners)
  - [ ] SHOPIFY_API_SECRET obtained (from Partners)
  - [ ] Optional: OPENAI_API_KEY, SENTRY_DSN, RESEND_API_KEY

- [ ] **Dependencies audit**
  ```bash
  pip list --outdated  # Check for security updates
  pip check  # Check for conflicts
  ```

### Render Account Setup (10 minutes)

- [ ] **Render account accessible**
  - Login: veylith.ops@proton.me
  - Account: RetailOSBackend
  - Dashboard: https://dashboard.render.com

- [ ] **Billing verified**
  - Payment method added
  - Sufficient credits for services ($14/month minimum)

- [ ] **GitHub connection active**
  - Repository authorized in Render
  - Webhook configured for auto-deploy

### Backup & Rollback Preparation (5 minutes)

- [ ] **Current code tagged**
  ```bash
  git tag -a v1.0.0-pre-deploy -m "Pre-deployment snapshot"
  git push origin v1.0.0-pre-deploy
  ```

- [ ] **Rollback branch created**
  ```bash
  git checkout -b rollback/pre-deployment-backup
  git push origin rollback/pre-deployment-backup
  git checkout main
  ```

- [ ] **Local database backup**
  ```bash
  # If you have local test data worth preserving
  pg_dump $DATABASE_URL > /tmp/local_backup_$(date +%Y%m%d).sql
  ```

### Communication & Monitoring (5 minutes)

- [ ] **Stakeholders notified**
  - Team aware of deployment window
  - Support team on standby

- [ ] **Monitoring tools ready**
  - Render dashboard open
  - Terminal ready for logs
  - Health check URLs bookmarked

---

## 🚀 Deployment Phases

### PHASE 1: Infrastructure Setup (30 minutes)

**Objective:** Create Render services without deploying code yet

#### Step 1.1: Create PostgreSQL Database (5 min)

**Method:** Render Dashboard

1. Navigate to: https://dashboard.render.com
2. Click **"New"** → **"PostgreSQL"**
3. Configure:
   ```
   Name: ecomdash-db
   Database: ecomdash
   User: ecomdash
   Region: Oregon
   Plan: Starter ($7/month)
   PostgreSQL Version: 15
   ```
4. Click **"Create Database"**
5. **Wait for status: "Available"** (2-3 minutes)
6. **⚠️ SAVE DATABASE_URL** (copy from dashboard)

**Validation:**
```bash
# Test connection
psql "<DATABASE_URL>" -c "SELECT version();"
# Should return PostgreSQL version
```

**Rollback:** Delete database from Render dashboard (data loss acceptable at this stage)

---

#### Step 1.2: Create Redis Instance (5 min)

**Method:** Render Dashboard

1. Click **"New"** → **"Redis"**
2. Configure:
   ```
   Name: ecomdash-redis
   Region: Oregon
   Plan: Free (25MB)
   Maxmemory Policy: allkeys-lru
   ```
3. Click **"Create Redis"**
4. **Wait for status: "Available"** (1-2 minutes)
5. **⚠️ SAVE REDIS_URL** (copy from dashboard)

**Validation:**
```bash
# Test Redis connection
redis-cli -u "<REDIS_URL>" PING
# Should return: PONG
```

**Rollback:** Delete Redis instance from dashboard

---

#### Step 1.3: Set Up Web Service (10 min)

**Method:** Render Blueprint (Automated)

1. Click **"New"** → **"Blueprint"**
2. Connect to GitHub repository
3. Select repository: `ecomdash-v2`
4. Select `render.yaml` blueprint
5. **Review services to be created:**
   - ecomdash-api (Web Service)
   - Database and Redis (already created, will link)
6. Click **"Apply Blueprint"**

**⚠️ PAUSE DEPLOYMENT:**
Before services start, set environment variables (next step)

**Rollback:** Dashboard → Service → Delete (services not started yet)

---

#### Step 1.4: Configure Environment Variables (10 min)

**Method:** Render Dashboard → ecomdash-api → Environment

**Required Variables:**

```bash
# Generate secrets locally first
SECRET_KEY=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "SECRET_KEY=$SECRET_KEY"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
```

**Add in Render Dashboard:**

| Key | Value | Source |
|-----|-------|--------|
| `ENVIRONMENT` | `production` | Static |
| `DEBUG` | `false` | Static |
| `LOG_LEVEL` | `INFO` | Static |
| `DATABASE_URL` | `<from Step 1.1>` | Auto-linked |
| `REDIS_URL` | `<from Step 1.2>` | Auto-linked |
| `SECRET_KEY` | `<generated above>` | **SECRET** |
| `ENCRYPTION_KEY` | `<generated above>` | **SECRET** |
| `SHOPIFY_API_KEY` | `<from Shopify Partners>` | **SECRET** |
| `SHOPIFY_API_SECRET` | `<from Shopify Partners>` | **SECRET** |
| `SHOPIFY_APP_URL` | `https://ecomdash-api.onrender.com` | Static |
| `ALLOWED_ORIGINS` | `https://admin.shopify.com,https://ecomdash-api.onrender.com` | Static |

**Optional (for enhanced features):**

| Key | Value | Required? |
|-----|-------|-----------|
| `OPENAI_API_KEY` | `<your key>` | No (for AI features) |
| `SENTRY_DSN` | `<your DSN>` | No (error tracking) |
| `RESEND_API_KEY` | `<your key>` | No (email notifications) |

**Validation:**
- [ ] All required variables set
- [ ] Secrets marked as "Secret" (hidden)
- [ ] No typos in variable names
- [ ] DATABASE_URL and REDIS_URL auto-linked correctly

**⚠️ SECURITY CHECK:**
- [ ] No secrets committed to Git
- [ ] `.env` file in `.gitignore`
- [ ] Secrets stored securely (password manager)

**Rollback:** Can update env vars without redeployment

---

### PHASE 2: Database Migration (15 minutes)

**Objective:** Run Alembic migrations on production database

**⚠️ CRITICAL:** This step modifies production database. Have backup plan ready.

#### Step 2.1: Verify Database is Empty (2 min)

```bash
# Connect to production database
psql "<DATABASE_URL>" -c "\dt"

# Expected: No relations found (empty database)
# If tables exist: STOP and review (might be wrong database!)
```

**Decision Point:**
- ✅ Database empty → Proceed
- ❌ Tables exist → STOP, investigate, do not proceed

---

#### Step 2.2: Run Migrations via Render Shell (10 min)

**Method:** Render Dashboard → ecomdash-api → Shell

1. Open Render Shell for `ecomdash-api`
2. Wait for shell to initialize (30 seconds)
3. Run migration commands:

```bash
# 1. Verify Alembic is installed
which alembic
# Should return: /opt/render/project/src/.venv/bin/alembic

# 2. Check current migration status
alembic current
# Expected: No current revision (fresh DB)

# 3. Preview migration (dry run)
alembic upgrade --sql head | head -50
# Review the SQL to be executed

# 4. Run migration (POINT OF NO RETURN)
alembic upgrade head

# 5. Verify migration success
alembic current
# Expected: Shows revision "002" (analytics schema)

# 6. Verify tables created
python3 -c "
from app.core.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
print('Tables:', inspector.get_table_names())
"
# Expected: ['analytics_events', 'analytics_sessions', 'conversion_events', ...]
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, initial schema
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002, analytics schema
```

**Validation:**
```bash
# Count tables
psql "<DATABASE_URL>" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
# Expected: 6+ tables

# Check specific table
psql "<DATABASE_URL>" -c "\d analytics_events"
# Should show table structure with columns and indexes
```

**Rollback (if migration fails):**
```bash
# Downgrade to previous revision
alembic downgrade -1

# Or, drop all tables and start over (DATA LOSS!)
psql "<DATABASE_URL>" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

**⚠️ If migration fails:**
1. Copy error message
2. Check logs: `render services logs ecomdash-api`
3. Do NOT retry blindly
4. Investigate error, fix code, redeploy
5. Consider manual SQL fixes if needed

---

#### Step 2.3: Verify Database Indexes (3 min)

```bash
# Check that indexes were created
psql "<DATABASE_URL>" -c "
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"

# Expected: 10+ indexes including:
# - idx_events_timestamp_path
# - idx_events_session_timestamp
# - idx_sessions_start_time
# etc.
```

**Decision Point:**
- ✅ All indexes present → Proceed
- ❌ Missing indexes → Re-run migration or create manually

---

### PHASE 3: Application Deployment (20 minutes)

**Objective:** Deploy FastAPI application to Render

#### Step 3.1: Trigger Deployment (5 min)

**Method:** Git push triggers auto-deploy

```bash
# Ensure on main branch
git checkout main

# Tag release
git tag -a v1.0.0 -m "APEX Analytics MVP - Production Release"
git push origin v1.0.0

# Push triggers automatic deployment
git push origin main
```

**Monitor in Render Dashboard:**
1. Navigate to: ecomdash-api → Events
2. Watch build logs in real-time
3. Look for:
   - "Build started"
   - "Installing dependencies..."
   - "Build succeeded"
   - "Deploy started"
   - "Deploy live"

**Expected Timeline:**
- Build: 3-5 minutes
- Deploy: 1-2 minutes
- Health check: 30 seconds

**Validation:**
```bash
# Wait for "Deploy live" status, then test
curl https://ecomdash-api.onrender.com/health

# Expected response:
# {"status":"healthy","version":"2.0.0","timestamp":"2026-01-07T..."}
```

**Rollback (if deployment fails):**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
# Render auto-deploys the rollback
```

---

#### Step 3.2: Verify Service Health (5 min)

**Automated Health Checks:**

```bash
# 1. Basic health
curl -i https://ecomdash-api.onrender.com/health
# Expected: HTTP 200, JSON response

# 2. API documentation
curl -I https://ecomdash-api.onrender.com/docs
# Expected: HTTP 200 (or 404 if DEBUG=false)

# 3. Database connectivity
curl https://ecomdash-api.onrender.com/health | jq '.database'
# Expected: "connected" or similar

# 4. Redis connectivity
curl https://ecomdash-api.onrender.com/health | jq '.redis'
# Expected: "connected"
```

**Manual Verification in Render Dashboard:**
- [ ] Service status: "Live" (green)
- [ ] Last deploy: Within last 10 minutes
- [ ] Health checks: Passing
- [ ] No error logs in last 5 minutes

**Decision Point:**
- ✅ All checks passing → Proceed to Phase 4
- ❌ Any check failing → PAUSE, investigate logs, fix, redeploy

---

#### Step 3.3: Load Test with Synthetic Data (10 min)

**Objective:** Verify system handles realistic load

```bash
# From your local machine (with venv activated)
cd backend

# Generate 20 test sessions (low load)
python3 tests/test_data_generator.py https://ecomdash-api.onrender.com 20

# Expected output:
# ✓ Generated browser session with 3 events
# ✓ Generated researcher session with 7 events
# ✓ Generated high_intent_buyer session with 9 events
# ...
# ✅ Generation Complete!
# Total Sessions: 20
# Total Events: 120
# Successful: 120
# Failed: 0
```

**Validation:**
```bash
# Query analytics summary
curl "https://ecomdash-api.onrender.com/api/v1/analytics/summary?date_from=2026-01-01T00:00:00&date_to=2026-12-31T23:59:59" | jq '.total_sessions'
# Expected: 20 (or more if multiple runs)

# Check real-time stats
curl https://ecomdash-api.onrender.com/api/v1/analytics/realtime | jq '.visitors_last_5min'
# Expected: 0 (synthetic sessions are in the past)
```

**Performance Validation:**
```bash
# Measure API latency
time curl -o /dev/null -s https://ecomdash-api.onrender.com/api/v1/analytics/realtime

# Expected: <500ms (target met)
# If >500ms: Investigate slow queries, add indexes, optimize code
```

**Decision Point:**
- ✅ All events processed, no errors → Proceed
- ⚠️ Some errors (<5%) → Investigate but can proceed
- ❌ Many errors (>10%) → STOP, debug, fix, redeploy

---

### PHASE 4: Feature Validation (25 minutes)

**Objective:** Test critical ML and analytics features

#### Step 4.1: Test ML Intent Classification (10 min)

**Prerequisite:** Test data from Phase 3.3 loaded

1. **Get a session ID from database:**

```bash
# Query recent sessions
curl "https://ecomdash-api.onrender.com/api/v1/analytics/summary?date_from=2026-01-01T00:00:00&date_to=2026-12-31T23:59:59" > /tmp/summary.json

# Extract session IDs (manual)
cat /tmp/summary.json | jq '.top_pages'
# Note: This doesn't show session IDs directly

# Alternative: Query database directly
psql "<DATABASE_URL>" -c "SELECT session_id, visitor_id, pageview_count FROM analytics_sessions LIMIT 5;"
# Copy a session_id and visitor_id for testing
```

2. **Test ML classification:**

```bash
# Replace with actual IDs from step 1
SESSION_ID="sess_abc123"
VISITOR_ID="visitor_xyz789"

curl -X POST "https://ecomdash-api.onrender.com/api/v1/analytics/ml/classify-intent?session_id=$SESSION_ID&visitor_id=$VISITOR_ID&time_on_site_seconds=15"

# Expected response:
# {
#   "intent_class": "browser" | "researcher" | "high_intent_buyer",
#   "confidence": 0.65,
#   "contributing_factors": ["Limited engagement signals"],
#   "behavioral_signals": {...},
#   "events_analyzed": 5
# }
```

**Validation Criteria:**
- [ ] Returns valid JSON
- [ ] `intent_class` is one of: browser, researcher, high_intent_buyer
- [ ] `confidence` between 0.0 and 1.0
- [ ] `events_analyzed` > 0
- [ ] Response time < 2 seconds

**Test Multiple Archetypes:**

```bash
# Browser (low engagement)
# - Should have: low confidence, "Limited engagement" factors

# Researcher (medium engagement)
# - Should have: medium confidence, "Comparing products" factors

# High-Intent Buyer (high engagement)
# - Should have: high confidence (>0.7), "Add to cart" factors
```

**Decision Point:**
- ✅ ML working correctly → Proceed
- ⚠️ Confidence scores seem off → Note for improvement, can proceed
- ❌ ML endpoint errors → STOP, debug service logs

---

#### Step 4.2: Test Analytics Dashboard Endpoints (10 min)

**1. Summary Endpoint:**

```bash
# Last 24 hours
curl "https://ecomdash-api.onrender.com/api/v1/analytics/summary?date_from=$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S)&date_to=$(date -u +%Y-%m-%dT%H:%M:%S)" | jq '.'

# Validate response structure:
# {
#   "total_pageviews": <number>,
#   "total_visitors": <number>,
#   "total_sessions": <number>,
#   "bounce_rate": <number>,
#   "top_pages": [...]
# }
```

**2. Real-Time Endpoint:**

```bash
curl https://ecomdash-api.onrender.com/api/v1/analytics/realtime | jq '.'

# Expected:
# {
#   "current_visitors": 0,
#   "visitors_last_5min": 0,
#   "pageviews_last_5min": 0
# }
```

**3. Performance Test:**

```bash
# Run 10 concurrent requests
for i in {1..10}; do
  (time curl -s https://ecomdash-api.onrender.com/api/v1/analytics/realtime > /dev/null) &
done
wait

# All should complete in <500ms
```

**Validation:**
- [ ] All endpoints return 200 OK
- [ ] Response times < 500ms (p95)
- [ ] Data matches test data generated
- [ ] No 500 errors in logs

---

#### Step 4.3: Test Client SDK (5 min)

**Create test HTML file:**

```html
<!-- /tmp/test_apex_sdk.html -->
<!DOCTYPE html>
<html>
<head><title>APEX SDK Test</title></head>
<body>
    <h1>Testing APEX Analytics SDK</h1>
    <button id="test-click">Test Click Event</button>

    <script>
        // Inline SDK for testing (in production, load from CDN)
        const APEX_SDK = `
            https://ecomdash-api.onrender.com/static/apex-analytics.js
        `;
    </script>
    <script src="https://ecomdash-api.onrender.com/static/apex-analytics.js"
            data-api-url="https://ecomdash-api.onrender.com"></script>

    <script>
        document.getElementById('test-click').addEventListener('click', () => {
            console.log('SDK test: Button clicked');
        });
    </script>
</body>
</html>
```

**Test Steps:**
1. Open `/tmp/test_apex_sdk.html` in browser
2. Open Developer Console (F12) → Network tab
3. Click the test button
4. **Verify:**
   - SDK loaded (check for `apex-analytics.js` in Network)
   - Pageview event sent on load
   - Click event sent when button clicked
   - Events sent to `/api/v1/analytics/track/batch`

**Alternative: Use curl to test SDK delivery:**

```bash
curl -I https://ecomdash-api.onrender.com/static/apex-analytics.js
# Expected: HTTP 200, Content-Type: application/javascript
```

**Decision Point:**
- ✅ SDK loads and tracks events → Complete
- ❌ SDK not found (404) → Check static file serving configuration

---

### PHASE 5: Monitoring & Alerts Setup (15 minutes)

**Objective:** Configure monitoring and alerting for production

#### Step 5.1: Configure Render Health Checks (5 min)

**In Render Dashboard → ecomdash-api → Settings:**

```yaml
Health Check Path: /health
Health Check Interval: 60 seconds
Health Check Timeout: 30 seconds
Health Check Threshold: 3 failures
```

**Validation:**
- [ ] Health check configured
- [ ] Status shows "Healthy"
- [ ] Last check < 2 minutes ago

---

#### Step 5.2: Set Up Log Monitoring (5 min)

**View Logs:**

```bash
# From terminal (if Render CLI installed)
render services logs ecomdash-api --tail 100

# Or via Dashboard:
# ecomdash-api → Logs → Enable Auto-refresh
```

**Monitor for:**
- ✅ INFO logs: "Application created", "Listening on 0.0.0.0:10000"
- ⚠️ WARNING logs: Note but don't panic
- ❌ ERROR logs: Investigate immediately
- ❌ CRITICAL logs: Potential incident

**Set Up Log Filters:**
```
Level: ERROR or CRITICAL
Time window: Last 1 hour
```

---

#### Step 5.3: Configure Alerts (Optional but Recommended) (5 min)

**Render Native Alerts:**

1. Dashboard → Notifications
2. Enable email alerts for:
   - [ ] Service deployment failures
   - [ ] Health check failures
   - [ ] Service crashes

**Sentry Integration (if SENTRY_DSN set):**

```bash
# Verify Sentry is capturing errors
curl https://ecomdash-api.onrender.com/api/v1/analytics/trigger-error-test

# Check Sentry dashboard for error
# (Only works if you intentionally added a test error endpoint)
```

**Decision Point:**
- ✅ Alerts configured → Complete
- ⚠️ Skipped alerts → Note: Set up later

---

### PHASE 6: Security Hardening (10 minutes)

**Objective:** Lock down production environment

#### Step 6.1: Verify HTTPS and SSL (2 min)

```bash
# Test SSL certificate
curl -vI https://ecomdash-api.onrender.com/health 2>&1 | grep "SSL"

# Expected:
# * SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256
# * Server certificate: *.onrender.com

# Ensure HTTP redirects to HTTPS
curl -I http://ecomdash-api.onrender.com/health
# Expected: HTTP 301 Moved Permanently → https://...
```

**Validation:**
- [ ] HTTPS working
- [ ] Valid SSL certificate
- [ ] HTTP redirects to HTTPS

---

#### Step 6.2: Test Rate Limiting (3 min)

```bash
# Send 200 requests rapidly
for i in {1..200}; do
  curl -s https://ecomdash-api.onrender.com/health > /dev/null &
done
wait

# Check if rate limiting kicked in
# Expected: Some requests return HTTP 429 (Too Many Requests)
```

**If no rate limiting:**
- Note: Consider adding nginx/Cloudflare in front
- Or implement in FastAPI middleware

---

#### Step 6.3: Verify Secrets Not Exposed (5 min)

**Check for common misconfigurations:**

```bash
# 1. Ensure /docs is disabled in production
curl -I https://ecomdash-api.onrender.com/docs
# Expected: HTTP 404 (if DEBUG=false)
# If 200: SECURITY ISSUE - Set DEBUG=false

# 2. Check error responses don't leak info
curl https://ecomdash-api.onrender.com/api/v1/analytics/nonexistent
# Expected: Generic error, no stack traces

# 3. Verify environment variables not in responses
curl https://ecomdash-api.onrender.com/health | grep -i "secret\|password\|key"
# Expected: No matches
```

**Validation:**
- [ ] No secrets in API responses
- [ ] Error messages don't leak implementation details
- [ ] Debug mode disabled (no /docs endpoint)

**Security Checklist:**
- [ ] All secrets in Render environment variables (not code)
- [ ] `.env` file in `.gitignore`
- [ ] No hardcoded credentials in code
- [ ] Database credentials rotated (not using defaults)
- [ ] CORS restricted to allowed origins
- [ ] HTTPS enforced

---

### PHASE 7: Post-Deployment Validation (15 minutes)

**Objective:** Final end-to-end testing and handoff

#### Step 7.1: End-to-End Smoke Tests (10 min)

**Full User Journey Simulation:**

```bash
# 1. Generate fresh test data
python3 tests/test_data_generator.py https://ecomdash-api.onrender.com 10

# 2. Verify data in analytics
SESSION_COUNT=$(curl -s "https://ecomdash-api.onrender.com/api/v1/analytics/summary?date_from=2026-01-01T00:00:00&date_to=2026-12-31T23:59:59" | jq '.total_sessions')
echo "Total sessions in DB: $SESSION_COUNT"
# Should be >= 10

# 3. Test ML classification on fresh session
LATEST_SESSION=$(psql "<DATABASE_URL>" -t -c "SELECT session_id, visitor_id FROM analytics_sessions ORDER BY start_time DESC LIMIT 1;")
echo "Latest session: $LATEST_SESSION"

# Parse session_id and visitor_id (manual)
curl -X POST "https://ecomdash-api.onrender.com/api/v1/analytics/ml/classify-intent?session_id=<ID>&visitor_id=<ID>&time_on_site_seconds=15"

# 4. Test real-time endpoint
curl https://ecomdash-api.onrender.com/api/v1/analytics/realtime | jq '.'

# 5. Performance check
time curl -s https://ecomdash-api.onrender.com/api/v1/analytics/realtime > /dev/null
# Expected: <500ms
```

**Validation Criteria:**
- [ ] All endpoints responding
- [ ] Data persisting correctly
- [ ] ML classification working
- [ ] Performance within targets
- [ ] No errors in logs

---

#### Step 7.2: Documentation Update (5 min)

**Update deployment records:**

```bash
# Create deployment log
cat > DEPLOYMENT_LOG.md <<EOF
# APEX Analytics Deployment Log

**Deployment Date:** $(date)
**Deployed By:** [Your Name]
**Version:** v1.0.0
**Render Account:** RetailOSBackend (veylith.ops@proton.me)

## Services Deployed
- ecomdash-api: https://ecomdash-api.onrender.com
- ecomdash-db: PostgreSQL (Starter plan)
- ecomdash-redis: Redis (Free tier)

## Environment Variables Set
- SECRET_KEY: [SET]
- ENCRYPTION_KEY: [SET]
- SHOPIFY_API_KEY: [SET]
- SHOPIFY_API_SECRET: [SET]
- DATABASE_URL: [AUTO]
- REDIS_URL: [AUTO]

## Post-Deployment Tests
- Health check: PASS
- ML classification: PASS
- Analytics API: PASS
- Performance: PASS (<500ms)
- Test data loaded: 30 sessions

## Issues Encountered
[None / List any issues and resolutions]

## Next Steps
- Set up Shopify app OAuth
- Onboard first merchant
- Monitor performance for 24 hours
EOF

git add DEPLOYMENT_LOG.md
git commit -m "Add deployment log for v1.0.0"
git push origin main
```

---

## 🔄 Rollback Procedures

### Scenario 1: Deployment Fails (Build/Deploy Error)

**Symptoms:** Red status in Render, build logs show errors

**Rollback Steps:**
```bash
# 1. Revert to previous version
git revert HEAD
git push origin main

# 2. Monitor Render dashboard for redeployment
# 3. Verify health check passes
curl https://ecomdash-api.onrender.com/health
```

**Recovery Time:** 5-10 minutes

---

### Scenario 2: Database Migration Fails

**Symptoms:** Migration errors, tables not created

**Rollback Steps:**
```bash
# 1. Connect to database
psql "<DATABASE_URL>"

# 2. Drop failed migration
alembic downgrade -1

# 3. Or, nuclear option (if no production data yet)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# 4. Fix migration code locally
# 5. Redeploy
```

**Recovery Time:** 15-30 minutes

---

### Scenario 3: Service Crashes on Startup

**Symptoms:** Service won't stay running, crash loop

**Rollback Steps:**
```bash
# 1. Check logs for errors
render services logs ecomdash-api --tail 500

# 2. Common fixes:
#    - Check DATABASE_URL is correct
#    - Verify all required env vars set
#    - Check for import errors

# 3. If unfixable immediately:
#    - Revert to previous git commit
#    - Or disable service temporarily
```

**Recovery Time:** 10-20 minutes

---

### Scenario 4: Performance Degradation

**Symptoms:** API responses >1 second, timeouts

**Rollback Steps:**
```bash
# 1. Check Render metrics
#    - CPU usage >80%?
#    - Memory usage >90%?

# 2. Scale up plan temporarily
#    Starter → Standard ($25/mo)

# 3. Or rollback deployment if recent change caused it
git revert HEAD
git push origin main
```

**Recovery Time:** Immediate (plan upgrade) or 10 minutes (rollback)

---

## 📊 Success Metrics & Acceptance Criteria

### Deployment Success Criteria

All must be ✅ to consider deployment successful:

**Infrastructure:**
- [ ] All services "Live" in Render dashboard
- [ ] Health checks passing
- [ ] No crash loops or restarts

**Functionality:**
- [ ] API endpoints responding (200 OK)
- [ ] ML classification working
- [ ] Analytics data persisting
- [ ] Test data loaded successfully (30+ sessions)

**Performance:**
- [ ] API latency p95 < 500ms
- [ ] ML classification < 2 seconds
- [ ] Dashboard queries < 1 second
- [ ] Zero errors during load test

**Security:**
- [ ] HTTPS enforced
- [ ] Secrets not exposed
- [ ] Debug mode disabled
- [ ] Rate limiting active

**Monitoring:**
- [ ] Logs accessible
- [ ] Alerts configured
- [ ] Metrics tracking (optional but recommended)

---

### Key Performance Indicators (KPIs)

**Monitor for first 48 hours:**

| Metric | Target | How to Check |
|--------|--------|--------------|
| Uptime | >99.5% | Render dashboard |
| API Latency (p95) | <500ms | Manual testing |
| Error rate | <0.1% | Logs |
| Health check | 100% pass | Render monitoring |
| Database connections | <10 | psql activity |

**Weekly KPIs (post-launch):**
- API requests/day
- Unique visitors tracked
- ML classification requests/day
- Average intent confidence score
- Data growth rate (MB/week)

---

## 🚨 Emergency Contacts & Resources

### Support Resources

**Render Support:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Status: https://status.render.com
- Support: support@render.com (paid plans)

**Internal Team:**
- Deployment Lead: [Your Name/Email]
- Backend Engineer: [Contact]
- DevOps: [Contact]

**External Services:**
- Shopify Partners: partners.shopify.com
- Database Admin: (if applicable)

---

## 📋 Post-Deployment Checklist

### Immediate (Day 0)

- [ ] All services deployed and healthy
- [ ] Test data loaded and verified
- [ ] ML classification tested
- [ ] Performance validated (<500ms)
- [ ] Deployment log updated
- [ ] Team notified of successful deployment

### Short-term (Day 1-3)

- [ ] Monitor logs for errors
- [ ] Check performance metrics daily
- [ ] Verify no memory leaks
- [ ] Test with real Shopify store (if ready)
- [ ] Set up Shopify app OAuth

### Medium-term (Week 1)

- [ ] Onboard first merchant
- [ ] Collect real behavioral data
- [ ] Review and optimize slow queries
- [ ] Set up automated backups
- [ ] Create runbook for common issues

### Long-term (Month 1)

- [ ] Analyze production metrics
- [ ] Plan Phase 2 features
- [ ] Security audit
- [ ] Performance optimization
- [ ] Scale plan if needed

---

## 🎯 Timeline Summary

| Phase | Duration | Can Run in Parallel? |
|-------|----------|---------------------|
| Pre-Deployment Checklist | 35 min | No |
| Phase 1: Infrastructure | 30 min | Partially |
| Phase 2: Database Migration | 15 min | No |
| Phase 3: Application Deploy | 20 min | No |
| Phase 4: Feature Validation | 25 min | Partially |
| Phase 5: Monitoring Setup | 15 min | Yes |
| Phase 6: Security Hardening | 10 min | Yes |
| Phase 7: Post-Deploy Validation | 15 min | No |
| **TOTAL** | **2h 45min** | |

**Optimized (parallel execution):** ~2 hours
**First-time deployment:** ~3-4 hours (with learning curve)

---

## ✅ Deployment Sign-Off

**Deployment Completed:** [ ] Yes [ ] No

**Completed By:** _______________________

**Date:** _______________________

**Services URLs:**
- API: https://ecomdash-api.onrender.com
- Health: https://ecomdash-api.onrender.com/health
- Docs: https://ecomdash-api.onrender.com/docs (if DEBUG=true)

**All acceptance criteria met:** [ ] Yes [ ] No

**Issues encountered:**
_______________________________________________________________
_______________________________________________________________

**Next actions:**
_______________________________________________________________
_______________________________________________________________

---

**END OF RUNBOOK**

*Last updated: January 7, 2026*
*Next review: After first production deployment*
