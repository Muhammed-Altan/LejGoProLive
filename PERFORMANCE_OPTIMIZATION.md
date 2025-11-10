# Availability API Performance Optimization Guide

## Problem
The availability API was taking 3.5-4 seconds to check product availability when selecting dates on the checkout page.

## Root Causes Identified
1. **No debouncing** - API calls were triggered immediately when users changed dates
2. **No caching** - Every request hit the database with full queries
3. **Inefficient database queries** - Multiple separate queries and table scans
4. **Missing database indexes** - No optimized indexes for date range queries
5. **No client-side caching** - Duplicate requests for same data

## Implemented Solutions

### 1. 🕐 Debouncing (500ms delay)
**Location**: `components/booking/ProductStep.vue`
**Impact**: Prevents API spam when users are actively selecting dates

```typescript
// Before: Immediate API call on every date change
watch([startDate, endDate], async () => { /* immediate API call */ })

// After: 500ms delay before API call
watch([startDate, endDate], () => {
  if (availabilityCheckTimeout) {
    clearTimeout(availabilityCheckTimeout)
  }
  availabilityCheckTimeout = setTimeout(performAvailabilityCheck, 500)
})
```

### 2. 🚀 Server-side Caching (5 minutes TTL)
**Location**: `server/api/availability/check.post.ts`
**Impact**: Avoids database queries for recently checked date ranges

```typescript
// Cache key based on dates + product/accessory IDs
const cacheKey = generateCacheKey(request)
const cached = apiCache.get(cacheKey)
if (cached) return cached

// ... perform query ...
apiCache.set(cacheKey, response, 300) // 5 minutes
```

### 3. 💾 Client-side Caching (2 minutes TTL)
**Location**: `composables/useAvailability.ts`
**Impact**: Eliminates duplicate API calls for same data

```typescript
const cachedResult = getFromCache(cacheKey)
if (cachedResult) {
  availabilityResults.value = cachedResult
  return cachedResult
}
```

### 4. 📊 Optimized Database Queries
**Location**: `server/api/availability/check.post.ts`
**Impact**: Single query with joins instead of multiple round trips

```typescript
// Before: Separate queries for cameras + bookings
const cameras = await supabase.from('Camera').select('*')
const bookings = await supabase.from('Booking').select('*')

// After: Single query with join
const camerasWithBookings = await supabase
  .from('Camera')
  .select('*, Booking!cameraId(*)')
  .in('productId', productIds)
```

### 5. 🔍 Database Indexes
**Location**: `database_performance_indexes.sql`
**Impact**: Faster date range queries and lookups

Key indexes added:
- `idx_booking_date_range` - For booking overlap queries
- `idx_camera_product_id` - For product-camera relationships
- `idx_booking_active` - For active (non-cancelled) bookings

## Expected Performance Improvements

### Before Optimization
- **Cold requests**: 3.5-4 seconds
- **Repeated requests**: 3.5-4 seconds (no caching)
- **Database load**: High (multiple queries per check)

### After Optimization
- **Cold requests**: 1-2 seconds (optimized queries + indexes)
- **Cached requests**: 50-100ms (server cache hit)
- **Client cached**: <10ms (client cache hit)
- **Database load**: Reduced by 70-80%

## Implementation Checklist

### ✅ Completed
1. Added debouncing to date picker changes
2. Implemented server-side caching with TTL
3. Added client-side caching in composable
4. Optimized database queries (single query with joins)
5. Created database index optimization script
6. Added performance logging and monitoring

### 🔧 Next Steps (Optional)
1. **Run the database indexes**: Execute `database_performance_indexes.sql` in Supabase
2. **Monitor performance**: Check browser console for timing logs
3. **Cache invalidation**: Integrate cache invalidation in booking creation/cancellation
4. **Further optimization**: Consider pagination for large datasets

## Usage Instructions

### For Developers
1. **Database Indexes**: Run the SQL script in `database_performance_indexes.sql` via Supabase SQL Editor
2. **Monitor Performance**: Check browser console for performance timing logs
3. **Cache Management**: Cache is automatically managed, but can be cleared manually if needed

### For Testing
1. Navigate to checkout page
2. Select different date ranges
3. Observe:
   - First selection: ~1-2 seconds (optimized database query)
   - Same date range: <100ms (cache hit)
   - Different date range: <100ms if server cached, ~1-2s if not

## Cache Strategy Details

### Server Cache (5 minutes)
- **Purpose**: Avoid database queries for popular date ranges
- **TTL**: 300 seconds (5 minutes)
- **Key**: Based on dates + product/accessory IDs
- **Storage**: In-memory (lost on server restart)

### Client Cache (2 minutes)
- **Purpose**: Avoid duplicate API calls in same session
- **TTL**: 120 seconds (2 minutes)  
- **Key**: Same as server cache
- **Storage**: Browser memory (lost on page refresh)

## Troubleshooting

### Still Slow Performance
1. **Check database indexes**: Ensure SQL script was executed
2. **Monitor network**: Use browser DevTools to check request times
3. **Clear cache**: Try with different date ranges to test cold performance
4. **Database size**: Large datasets may need query pagination

### Cache Issues
1. **Stale data**: Cache TTL ensures data freshness (max 5 minutes old)
2. **Memory usage**: Client cache auto-cleans expired entries
3. **Server restart**: Server cache is lost, but will rebuild automatically

## Performance Monitoring

The implementation includes comprehensive logging:
- API response times
- Cache hit/miss rates
- Database query performance
- Client-side timing

Check browser console for real-time performance metrics.