# Cache Invalidation - Common Issues & Solutions

**Quick Diagnosis Guide**  
Use this document to troubleshoot cache-related issues on the frontend

---

## 🔍 Symptom Checklist

### Symptom 1: "Data doesn't update after PATCH"

```
Timeline:
T=0s:   PATCH /accounts/{id} ✅ (returns 200)
T=1s:   Frontend tries GET (expecting new data)
T=1s:   ❌ Returns OLD data (cache not invalidated yet!)
T=2s:   User confused - data should have updated!
```

**Root Cause:** Frontend refetching **before** cache invalidation completes

**Solution:**
```typescript
// ❌ Wrong
const response = await patch(...);
const data = await get(...); // Too fast!

// ✅ Correct
const response = await patch(...);
await delay(2500); // Wait for invalidation
const data = await get(...);
```

---

### Symptom 2: "Update succeeds but UI shows old data"

```
Timeline:
T=0s:    PATCH succeeds
T=2.5s:  Frontend delays (good!)
T=3s:    GET /accounts/{id}
T=3.1s:  Backend: ❌ Cache miss, querying Dataverse...
T=3.5s:  Response: {...old data...}  ← WRONG!
T=3.5s:  UI renders old data
```

**Root Cause:** Data wasn't actually saved in Dataverse (validation failed)

**Solution:**
```typescript
// Check PATCH response for errors
const response = await patch('/accounts/{id}', data);
if (!response.ok) {
  console.error('Update failed:', response.error);
  return; // Don't refetch!
}

await delay(2500);
const updated = await get('/accounts/{id}');
```

---

### Symptom 3: "Works first time, then breaks on second update"

```
Timeline:
First Update:
T=0s:    PATCH → 200 OK
T=2.5s:  Delay
T=3s:    GET → New data ✅

Second Update:
T=10s:   PATCH → 200 OK
T=12.5s: Delay
T=13s:   GET → OLD data ❌
```

**Root Cause:** Redis crashed or lost connection between updates

**Solution:**
```typescript
// Monitor Redis connection
if (!redis.isConnected) {
  console.warn('Cache unavailable, data may be stale');
  // Use longer delay as fallback
  await delay(5000);
}
```

---

### Symptom 4: "Different users seeing conflicting data"

```
User A:
PATCH /accounts/A → Cache invalidated: account:account:A
GET /accounts/A → New data ✅

User B:
GET /accounts/A → Gets User A's cache! ❌
```

**Root Cause:** Security issue - wrong cache key structure

**Solution:** Cache keys use account GUID, not account name
```typescript
// ✅ Correct (isolated per user)
account:account:abc123-guid-abc123
account:account:def456-guid-def456

// ❌ Wrong (could mix data)
account:account:john@example.com
```

---

### Symptom 5: "Seeing cached data in browser, not server"

```
T=0s:    Browser GET /accounts/{id}
T=0.5s:  Server: Cache HIT (returns from Redis)
T=1s:    Browser: Caches response (localStorage, IndexedDB, etc)

T=30s:   User refreshes page
T=30.5s: Browser returns cached copy from localStorage
T=31s:   OLD data shown!
```

**Root Cause:** Frontend has its own caching layer (HTTP cache, localStorage)

**Solution:**
```typescript
// Tell browser not to cache
const response = await get('/accounts/{id}', {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
});

// Or clear local storage after PATCH
localStorage.removeItem('account_cache');
```

---

## 🔧 Diagnostic Checklist

### Before saying "Backend is broken"

#### Step 1: Verify PATCH succeeded
```typescript
const response = await patch('/accounts/{id}', data);
console.log('PATCH Status:', response.status); // Should be 200
console.log('Response:', response.data);       // Should show updated data
```

#### Step 2: Check backend logs
```
[Backend Console]
[Nest] 21/01/2026, 10:45:30 AM   [AccountCrudService] 
✅ Account updated successfully - Operation: update_account_1...

[Nest] 21/01/2026, 10:45:30 AM   [CacheService] 
🗑️ [CACHE INVALIDATION] Account cache cleared for user abc123***
```

If you don't see `[CACHE INVALIDATION]`, the backend code didn't execute!

#### Step 3: Verify delay
```typescript
const start = Date.now();
await delay(2500);
console.log('Waited:', Date.now() - start, 'ms');
```

#### Step 4: Check GET response
```typescript
const response = await get('/accounts/{id}');
console.log('GET Status:', response.status);
console.log('Data freshness:', response.data.modifiedon);
```

#### Step 5: Compare timestamps
```typescript
// If Dataverse query was recent, data is fresh
const modifiedTime = new Date(response.data.modifiedon);
const now = new Date();
const ageSeconds = (now - modifiedTime) / 1000;

console.log('Data age:', ageSeconds, 'seconds');
if (ageSeconds < 5) {
  console.log('✅ Data is fresh (from Dataverse)');
} else {
  console.log('⚠️ Data might be stale (from old cache)');
}
```

---

## 📊 Expected Timing

### Normal Flow

```
T=0.0s:  PATCH sent
T=0.2s:  PATCH response received (200 OK)
         Backend internally: Validate → Update → Invalidate cache
         [CACHE INVALIDATION] log appears

T=2.5s:  Frontend finished waiting

T=2.6s:  GET sent
T=2.8s:  GET response received
         Backend: ❌ CACHE MISS → Query Dataverse → Return new data

T=3.0s:  Data displayed to user
         Timeline from PATCH to UI update: ~3 seconds ✅
```

### If Timing is Wrong

```
❌ Scenario A: GET arrives before invalidation
T=0.0s:  PATCH sent
T=0.2s:  PATCH response received
T=0.3s:  GET sent (too fast!)
         Backend still invalidating... GET hits stale cache
T=0.4s:  GET returns OLD data

Fix: Increase delay to 3-5 seconds

---

❌ Scenario B: Redis down
T=0.0s:  PATCH sent
T=0.2s:  PATCH response received
         Backend tries to invalidate → Redis ERROR
         [ERROR] Failed to invalidate cache
T=2.5s:  Frontend finished waiting
T=2.6s:  GET sent
T=2.8s:  GET response received
         Backend: Cache unavailable, hitting Dataverse anyway
T=3.0s:  NEW data returned (lucky!)
         But if Dataverse write is slow, could return old data

Fix: Monitor Redis health: `redis-cli PING`

---

❌ Scenario C: Browser cache
T=0.0s:  PATCH sent
T=0.2s:  PATCH response received
T=2.5s:  Frontend finished waiting
T=2.6s:  GET sent
T=2.8s:  GET response received (NEW data)
T=3.0s:  Browser returns cached copy from localStorage (OLD!)

Fix: Clear browser cache or disable client-side caching
```

---

## 🛠️ Advanced Debugging

### Enable Redis Monitor (Terminal)

```bash
# Terminal 1: Start monitoring Redis
redis-cli MONITOR

# Terminal 2: Run your PATCH operation
curl -X PATCH http://localhost:3000/accounts/{id} ...

# Terminal 1 shows:
1642755930.123456 [0 127.0.0.1:54321] "GET" "account:account:abc123"
1642755930.234567 [0 127.0.0.1:54321] "DEL" "account:account:abc123"  ← Invalidation!
```

### Check Cache Keys in Redis

```bash
# List all cache keys
redis-cli KEYS "account:*"

# Output:
# "account:account:abc123-guid"
# "account:address:abc123-guid"
# "account:contact:abc123-guid"

# Check specific key
redis-cli GET "account:account:abc123-guid"

# If output is (nil), cache was invalidated ✅
# If output is JSON, cache still exists ⚠️
```

### Trace Network Activity

```javascript
// Browser DevTools → Network tab

// 1. PATCH request
// Status: 200 OK
// Headers: Content-Type: application/json
// Response: { osot_table_accountid: "abc123...", osot_first_name: "João", ... }

// 2. Wait 2.5 seconds
// (Manual step, nothing to see here)

// 3. GET request
// Status: 200 OK
// Headers: X-Cache: MISS (if you see this, data came from Dataverse)
// Response: { osot_table_accountid: "abc123...", osot_first_name: "João", ... }
// (Should match PATCH response)
```

---

## 🚨 Critical Issues & Immediate Actions

### Issue: "Same data returned after 10 PATCH requests"

```
Indication: Loop bug or stale cache
Action: 
1. Restart Redis: redis-cli FLUSHALL
2. Check for duplicate PATCH calls
3. Verify cache invalidation in logs
```

### Issue: "One user's update affects another user's data"

```
Indication: Security bug - cache key mixing
Action:
1. STOP - do not proceed
2. Check cache keys use GUID (account:account:guid)
3. NOT email (account:account:email@example.com)
4. Verify data isolation in Redis
```

### Issue: "Performance degraded after updates"

```
Indication: Cache not working
Action:
1. Check Redis memory: redis-cli INFO memory
2. Check hit rate: redis-cli INFO stats
3. Look for errors: grep ERROR logs/*.log
4. Restart Redis if needed: redis-cli SHUTDOWN
```

---

## ✅ Verification Checklist

- [ ] PATCH returns 200 OK
- [ ] Backend logs show `[CACHE INVALIDATION]`
- [ ] Frontend waits 2-3 seconds
- [ ] GET request is sent
- [ ] GET response shows updated `modifiedon` timestamp
- [ ] UI renders new data
- [ ] Multiple updates work correctly
- [ ] Redis connection is stable
- [ ] No error logs in backend
- [ ] Browser cache is not interfering

---

## 📞 Report Issues

If you've gone through this entire checklist and still have issues:

1. Collect logs from both backend and browser console
2. Provide timing information (when PATCH sent, when GET sent)
3. Include Redis status: `redis-cli PING`
4. Include backend error logs (grep ERROR)
5. Check if Redis is running: `redis-cli` (should connect)

**Note:** Most issues are timing-related. A 2-3 second delay solves 80% of problems.
