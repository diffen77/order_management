-- Migration to extend customers table with producer-specific fields
-- This adds fields needed to represent producers (farmers, food vendors)

-- Create enum type for producer types
CREATE TYPE producer_type AS ENUM ('small_farm', 'wholesale_supplier', 'artisan_vendor');

-- Add producer-specific columns to the customers table
ALTER TABLE customers
ADD COLUMN business_name TEXT,
ADD COLUMN business_id TEXT,
ADD COLUMN producer_type producer_type,
ADD COLUMN website TEXT,
ADD COLUMN description TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Create indexes for efficient querying
CREATE INDEX idx_customers_producer_type ON customers(producer_type);
CREATE INDEX idx_customers_business_name ON customers(business_name);
CREATE INDEX idx_customers_is_active ON customers(is_active);

-- Set RLS policies for producer fields
CREATE POLICY "Authenticated users can view active producers"
ON customers
FOR SELECT
TO authenticated
USING (is_active = TRUE OR is_active IS NULL);

-- Enable updates via API
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Update trigger for keeping updated_at current
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply the trigger if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_customers_updated_at') THEN
        CREATE TRIGGER set_customers_updated_at
        BEFORE UPDATE ON customers
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END
$$;

-- Add comment to table
COMMENT ON TABLE customers IS 'Stores customer/producer information for the order management system';
COMMENT ON COLUMN customers.business_name IS 'Business name for producers (farm or vendor name)';
COMMENT ON COLUMN customers.business_id IS 'Tax ID or other business identifier';
COMMENT ON COLUMN customers.producer_type IS 'Type of producer (small farm, wholesale supplier, artisan vendor)';
COMMENT ON COLUMN customers.is_active IS 'Whether the producer is currently active'; 