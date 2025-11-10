-- Database Performance Optimization for LejGoPro Availability System
-- Run these queries in your Supabase SQL Editor to improve availability checking performance

-- 1. Add indexes for date range queries on Booking table
CREATE INDEX IF NOT EXISTS idx_booking_date_range 
ON "Booking" (cameraId, startDate, endDate, paymentStatus) 
WHERE paymentStatus != 'cancelled';

-- 2. Add index for product-based camera queries
CREATE INDEX IF NOT EXISTS idx_camera_product_id 
ON "Camera" (productId);

-- 3. Add index for accessory instance queries
CREATE INDEX IF NOT EXISTS idx_accessory_instance_accessory_id 
ON "AccessoryInstance" (accessoryId, isAvailable);

-- 4. Add partial index for active bookings (excludes cancelled)
CREATE INDEX IF NOT EXISTS idx_booking_active 
ON "Booking" (cameraId, startDate, endDate) 
WHERE paymentStatus != 'cancelled';

-- 5. Add index for accessory instance booking queries
CREATE INDEX IF NOT EXISTS idx_booking_accessory_instances 
ON "Booking" USING gin(accessoryInstanceIds)
WHERE paymentStatus != 'cancelled' AND accessoryInstanceIds IS NOT NULL;

-- 6. Analyze tables to update statistics
ANALYZE "Booking";
ANALYZE "Camera";
ANALYZE "Product";
ANALYZE "AccessoryInstance";

-- 7. View current indexes to verify creation
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('Booking', 'Camera', 'Product', 'AccessoryInstance')
ORDER BY tablename, indexname;