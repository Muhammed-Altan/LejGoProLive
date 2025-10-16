-- Migration: Add DineroIntegration table for storing Dinero OAuth tokens and organization info
-- Date: 2025-10-15

-- Create DineroIntegration table
CREATE TABLE IF NOT EXISTS "DineroIntegration" (
    "id" SERIAL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "organizationId" TEXT NOT NULL,
    "organizationName" TEXT,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "lastSync" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_dinero_integration_organization_id" ON "DineroIntegration"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_dinero_integration_created_at" ON "DineroIntegration"("createdAt");

-- Add RLS (Row Level Security) policies if needed
-- Enable RLS on the table
ALTER TABLE "DineroIntegration" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
-- Note: You might want to restrict this based on user roles in a real application
CREATE POLICY "Allow all operations on DineroIntegration" ON "DineroIntegration"
    FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE "DineroIntegration" IS 'Stores Dinero.dk OAuth integration tokens and organization information';
COMMENT ON COLUMN "DineroIntegration"."accessToken" IS 'OAuth access token for Dinero API';
COMMENT ON COLUMN "DineroIntegration"."refreshToken" IS 'OAuth refresh token for token renewal';
COMMENT ON COLUMN "DineroIntegration"."organizationId" IS 'Dinero organization ID';
COMMENT ON COLUMN "DineroIntegration"."organizationName" IS 'Dinero organization name for display';
COMMENT ON COLUMN "DineroIntegration"."expiresAt" IS 'When the access token expires';
COMMENT ON COLUMN "DineroIntegration"."lastSync" IS 'Last time products were synced to Dinero';

-- Optional: Create a function to automatically update the updatedAt column
CREATE OR REPLACE FUNCTION update_dinero_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updatedAt
CREATE TRIGGER trigger_update_dinero_integration_updated_at
    BEFORE UPDATE ON "DineroIntegration"
    FOR EACH ROW
    EXECUTE FUNCTION update_dinero_integration_updated_at();