-- Create tables for fulfillment reporting
-- This migration adds tables for storing fulfillment reports and report schedules

-- Create table for fulfillment reports
CREATE TABLE fulfillment_reports (
    id UUID PRIMARY KEY,
    report_type TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    report_data JSONB NOT NULL,
    generated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create table for report schedules
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY,
    report_type TEXT NOT NULL,
    frequency TEXT NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]',
    filters JSONB NOT NULL DEFAULT '{}',
    format TEXT NOT NULL DEFAULT 'json',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    next_generation TIMESTAMPTZ NOT NULL,
    last_generated TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for report distribution history
CREATE TABLE report_distributions (
    id UUID PRIMARY KEY,
    report_id UUID REFERENCES fulfillment_reports(id),
    schedule_id UUID REFERENCES report_schedules(id),
    distributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recipients JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL,
    error_message TEXT
);

-- Add indexes for performance
CREATE INDEX ON fulfillment_reports (report_type);
CREATE INDEX ON fulfillment_reports (generated_at);
CREATE INDEX ON fulfillment_reports (period_start, period_end);
CREATE INDEX ON fulfillment_reports (generated_by);
CREATE INDEX ON report_schedules (next_generation);
CREATE INDEX ON report_schedules (active);
CREATE INDEX ON report_distributions (report_id);
CREATE INDEX ON report_distributions (schedule_id);
CREATE INDEX ON report_distributions (distributed_at);

-- Add RLS policies for security
ALTER TABLE fulfillment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_distributions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can access all reports"
    ON fulfillment_reports
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Staff can access all reports"
    ON fulfillment_reports
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'staff');

CREATE POLICY "Admins can manage all schedules"
    ON report_schedules
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Staff can view all schedules"
    ON report_schedules
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'staff');

CREATE POLICY "Admins can access all distributions"
    ON report_distributions
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Staff can view all distributions"
    ON report_distributions
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'staff'); 