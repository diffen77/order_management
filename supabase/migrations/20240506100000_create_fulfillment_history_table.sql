-- Migration: Create fulfillment_history table
-- This table tracks changes to order fulfillment status

-- Create the fulfillment_history table
CREATE TABLE IF NOT EXISTS public.fulfillment_history (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints and indexes
    CONSTRAINT fulfillment_history_status_check CHECK (
        new_status IN ('pending', 'processing', 'picked', 'packed', 'ready', 'shipped', 'completed', 'cancelled')
    )
);

-- Add index for faster lookups by order
CREATE INDEX IF NOT EXISTS idx_fulfillment_history_order_id ON public.fulfillment_history(order_id);

-- Add index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_fulfillment_history_created_at ON public.fulfillment_history(created_at);

-- Grant permissions
ALTER TABLE public.fulfillment_history ENABLE ROW LEVEL SECURITY;

-- Create policy for staff and admins to read all history
CREATE POLICY fulfillment_history_read_policy ON public.fulfillment_history
    FOR SELECT
    USING (
        auth.role() IN ('service_role', 'supabase_admin')
        OR (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'staff')
    );

-- Create policy for staff and admins to insert history
CREATE POLICY fulfillment_history_insert_policy ON public.fulfillment_history
    FOR INSERT
    WITH CHECK (
        auth.role() IN ('service_role', 'supabase_admin')
        OR (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'staff')
    );

-- Give necessary permissions to authenticated users
GRANT SELECT ON public.fulfillment_history TO authenticated;
GRANT INSERT ON public.fulfillment_history TO authenticated;

-- Notify the system when changes are added
COMMENT ON TABLE public.fulfillment_history IS 'Tracks history of fulfillment status changes for orders'; 