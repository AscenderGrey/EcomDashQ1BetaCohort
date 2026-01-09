# APEX Analytics - Quick Deploy Checklist

**⏱️ Estimated Time:** 2-4 hours
**👤 Deploying:** _______________________
**📅 Date:** _______________________

---

## ⚡ Fast Track (Minimal Steps)

### 1. Pre-Flight (10 min)

```bash
# ✅ Verify code is ready
git status  # Clean?
git push origin main  # Pushed?

# ✅ Generate secrets
export SECRET_KEY=$(openssl rand -hex 32)
export ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "SECRET_KEY=$SECRET_KEY"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
# 💾 SAVE THESE SOMEWHERE SAFE!

# ✅ Run local tests
cd backend && source .venv/bin/activate
pytest tests/  # All pass?
```

**Decision:** ✅ Continue | ❌ Fix issues first

---

### 2. Create Render Services (15 min)

**Login:** https://dashboard.render.com
**Account:** RetailOSBackend (veylith.ops@proton.me)

#### A. PostgreSQL Database
1. New → PostgreSQL
2. Name: `ecomdash-db`, Region: Oregon, Plan: Starter
3. Create Database
4. **SAVE DATABASE_URL** ⚠️

#### B. Redis Cache
1. New → Redis
2. Name: `ecomdash-redis`, Region: Oregon, Plan: Free
3. Create Redis
4. **SAVE REDIS_URL** ⚠️

#### C. Web Service (Blueprint)
1. New → Blueprint
2. Connect GitHub repo: `ecomdash-v2`
3. Select `render.yaml`
4. **PAUSE before deploying**

---

### 3. Set Environment Variables (10 min)

**In Render Dashboard → ecomdash-api → Environment:**

```bash
# Copy-paste these (fill in values):
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
SECRET_KEY=<paste from step 1>
ENCRYPTION_KEY=<paste from step 1>
SHOPIFY_API_KEY=<from Shopify Partners>
SHOPIFY_API_SECRET=<from Shopify Partners>
SHOPIFY_APP_URL=https://ecomdash-api.onrender.com
ALLOWED_ORIGINS=https://admin.shopify.com,https://ecomdash-api.onrender.com
```

**DATABASE_URL and REDIS_URL** should auto-link. Verify!

**Decision:** ✅ All vars set | ❌ Get Shopify keys first

---

### 4. Deploy & Migrate (20 min)

```bash
# ✅ Trigger deployment (if not already started)
git push origin main  # Render auto-deploys

# ⏳ Wait for "Deploy Live" status (5-10 min)
# Watch logs in Render Dashboard

# ✅ Run database migrations
# In Render Shell (Dashboard → ecomdash-api → Shell):
alembic upgrade head

# ✅ Verify tables created
python3 -c "
from app.core.database import engine
from sqlalchemy import inspect
print('Tables:', inspect(engine).get_table_names())
"
# Should show: analytics_events, analytics_sessions, etc.
```

**Decision:** ✅ Deployed successfully | ❌ Check logs, fix, retry

---

### 5. Validate Deployment (15 min)

```bash
# ✅ Health check
curl https://ecomdash-api.onrender.com/health
# Expected: {"status":"healthy","version":"2.0.0"}

# ✅ Load test data
python3 tests/test_data_generator.py https://ecomdash-api.onrender.com 20
# Expected: 20 sessions, 0 failures

# ✅ Test ML classification
# 1. Get session ID from database:
psql "<DATABASE_URL>" -c "SELECT session_id, visitor_id FROM analytics_sessions LIMIT 1;"

# 2. Test classification (replace IDs):
curl -X POST "https://ecomdash-api.onrender.com/api/v1/analytics/ml/classify-intent?session_id=sess_XXX&visitor_id=visitor_YYY&time_on_site_seconds=15"
# Expected: Valid JSON with intent_class, confidence, etc.

# ✅ Performance check
time curl -s https://ecomdash-api.onrender.com/api/v1/analytics/realtime > /dev/null
# Expected: <500ms
```

**Decision:** ✅ All tests pass | ❌ Debug failing tests

---

### 6. Security Check (5 min)

```bash
# ✅ HTTPS enforced
curl -I http://ecomdash-api.onrender.com/health
# Expected: Redirect to https://

# ✅ Docs disabled (if DEBUG=false)
curl -I https://ecomdash-api.onrender.com/docs
# Expected: 404 Not Found

# ✅ No secrets exposed
curl https://ecomdash-api.onrender.com/health | grep -i "secret\|password"
# Expected: No matches
```

**Decision:** ✅ Secure | ⚠️ Note issues for later

---

### 7. Monitoring Setup (10 min)

**In Render Dashboard:**

1. **ecomdash-api → Settings → Health Check:**
   - Path: `/health`
   - Interval: 60 seconds
   - Save

2. **Notifications:**
   - Enable email alerts for:
     - Deployment failures
     - Health check failures
     - Service crashes

3. **Logs:**
   - Open Logs tab
   - Enable Auto-refresh
   - Verify no errors

**Decision:** ✅ Monitoring active | ⚠️ Manual monitoring for now

---

## ✅ Success Criteria

Mark all before considering deployment complete:

- [ ] All services "Live" in Render
- [ ] Health check returns 200 OK
- [ ] Database migrations applied
- [ ] Test data loaded (20+ sessions)
- [ ] ML classification working
- [ ] API latency <500ms
- [ ] HTTPS enforced
- [ ] Secrets not exposed in responses
- [ ] No error logs in last 10 minutes

---

## 🚨 Rollback Plan

If anything fails:

```bash
# 1. Revert code
git revert HEAD
git push origin main

# 2. Or delete services and start over
# (Safe if no production data yet)

# 3. Check logs for errors
render services logs ecomdash-api --tail 200
```

---

## 📞 Next Steps After Deployment

1. **Create Shopify App** (1 hour)
   - Go to: partners.shopify.com
   - Create new app
   - Add API credentials to Render env vars

2. **Test with Shopify Store** (30 min)
   - Install app on development store
   - Generate real traffic
   - Verify data collection

3. **Monitor for 24 hours**
   - Check logs daily
   - Verify no crashes
   - Monitor performance

4. **Onboard First Merchant** (1 week)
   - Create onboarding guide
   - Set up support process
   - Collect feedback

---

## 📋 Deployment Log

**Started:** _______________________

**Completed:** _______________________

**Issues:** _______________________

**Notes:** _______________________

---

## 🎉 You're Done!

**Services:**
- API: https://ecomdash-api.onrender.com
- Health: https://ecomdash-api.onrender.com/health
- Logs: Render Dashboard → ecomdash-api → Logs

**Cost:** $14/month (Starter plan for DB + API)

**Performance:** <500ms API latency ✅

**Next:** Set up Shopify app and onboard merchants! 🚀

---

*For detailed instructions, see: `APEX_DEPLOYMENT_RUNBOOK.md`*
