-- Add columns to Booking table for PostNord shipping integration
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE "Booking" 
ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryMethod" TEXT DEFAULT 'servicepoint',
ADD COLUMN IF NOT EXISTS "selectedServicePoint" JSONB,
ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;

-- Create index for faster lookup by tracking number
CREATE INDEX IF NOT EXISTS idx_booking_tracking_number ON "Booking"("trackingNumber");

-- Add comment
COMMENT ON COLUMN "Booking"."selectedServicePoint" IS 'PostNord service point details as JSON';
COMMENT ON COLUMN "Booking"."trackingNumber" IS 'PostNord shipment tracking number';
COMMENT ON COLUMN "Booking"."deliveryMethod" IS 'Delivery method: home or servicepoint';
