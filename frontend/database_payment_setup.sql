-- PensoPay Integration Database Setup
-- Run this in your Supabase SQL Editor

-- Add payment tracking columns to existing Booking table
ALTER TABLE "Booking" 
ADD COLUMN IF NOT EXISTS "orderId" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "paymentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "authorizedAt" TIMESTAMPTZ;

-- Create indexes for better performance on payment-related queries
CREATE INDEX IF NOT EXISTS idx_booking_order_id ON "Booking"("orderId");
CREATE INDEX IF NOT EXISTS idx_booking_payment_id ON "Booking"("paymentId");
CREATE INDEX IF NOT EXISTS idx_booking_payment_status ON "Booking"("paymentStatus");

-- Add constraint to ensure paymentStatus has valid values
ALTER TABLE "Booking" 
ADD CONSTRAINT check_payment_status 
CHECK ("paymentStatus" IN ('pending', 'processing', 'authorized', 'paid', 'failed', 'cancelled', 'refunded'));

-- Create a function to automatically update paidAt when paymentStatus changes to 'paid'
CREATE OR REPLACE FUNCTION update_paid_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If paymentStatus is changed to 'paid' and paidAt is null, set paidAt to current timestamp
    IF NEW."paymentStatus" = 'paid' AND OLD."paymentStatus" != 'paid' AND NEW."paidAt" IS NULL THEN
        NEW."paidAt" = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set paidAt when payment is successful
DROP TRIGGER IF EXISTS trigger_update_paid_at ON "Booking";
CREATE TRIGGER trigger_update_paid_at
    BEFORE UPDATE ON "Booking"
    FOR EACH ROW
    EXECUTE FUNCTION update_paid_at();

-- Add comments to the new columns for documentation
COMMENT ON COLUMN "Booking"."orderId" IS 'Unique order ID from payment system (PensoPay)';
COMMENT ON COLUMN "Booking"."paymentId" IS 'Payment ID from payment system (PensoPay)';
COMMENT ON COLUMN "Booking"."paymentStatus" IS 'Current payment status (pending, processing, paid, failed, cancelled, refunded)';
COMMENT ON COLUMN "Booking"."paidAt" IS 'Timestamp when payment was completed successfully';

-- View to check the new columns have been added correctly
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Booking' 
AND column_name IN ('orderId', 'paymentId', 'paymentStatus', 'paidAt')
ORDER BY ordinal_position;