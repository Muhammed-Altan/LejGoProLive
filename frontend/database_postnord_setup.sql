-- Add columns to Booking table for PostNord shipping integration
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE "Booking" 
ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryMethod" TEXT DEFAULT 'servicepoint',
ADD COLUMN IF NOT EXISTS "selectedServicePoint" JSONB,
ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
ADD COLUMN IF NOT EXISTS "returnTrackingNumber" TEXT,
ADD COLUMN IF NOT EXISTS "postNordItemId" TEXT,
ADD COLUMN IF NOT EXISTS "returnPostNordItemId" TEXT;

-- Create indexes for faster lookup by tracking numbers
CREATE INDEX IF NOT EXISTS idx_booking_tracking_number ON "Booking"("trackingNumber");
CREATE INDEX IF NOT EXISTS idx_booking_return_tracking_number ON "Booking"("returnTrackingNumber");

-- Add comments
COMMENT ON COLUMN "Booking"."selectedServicePoint" IS 'PostNord service point details as JSON';
COMMENT ON COLUMN "Booking"."trackingNumber" IS 'PostNord outbound shipment tracking number';
COMMENT ON COLUMN "Booking"."returnTrackingNumber" IS 'PostNord return shipment tracking number';
COMMENT ON COLUMN "Booking"."deliveryMethod" IS 'Delivery method: home or servicepoint';
COMMENT ON COLUMN "Booking"."postNordItemId" IS 'PostNord item ID for outbound shipment';
COMMENT ON COLUMN "Booking"."returnPostNordItemId" IS 'PostNord item ID for return shipment';
