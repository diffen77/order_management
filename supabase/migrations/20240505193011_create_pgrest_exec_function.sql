-- Create pgrest_exec function for MCP server integration
-- This function allows executing arbitrary SQL via PostgREST RPC

create or replace function pgrest_exec(query text)
returns jsonb
language plpgsql
security definer -- Runs with the privileges of the function creator
as $$
declare
  result jsonb;
begin
  execute query into result;
  return result;
exception when others then
  return jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
end;
$$;

-- Add read-only variant for safer SELECT queries
create or replace function pgrest_query(query text)
returns jsonb
language plpgsql
security definer -- Runs with the privileges of the function creator
as $$
declare
  result jsonb;
  query_type text;
begin
  -- Basic check to ensure only SELECT statements are allowed
  query_type := lower(substring(trim(query) from 1 for 6));
  if query_type != 'select' then
    raise exception 'Only SELECT statements are allowed in pgrest_query';
  end if;
  
  execute query into result;
  return result;
exception when others then
  return jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
end;
$$;

-- Create a function to create the dummy table for fallback operations
create or replace function create_dummy_table()
returns void
language plpgsql
security definer -- Runs with the privileges of the function creator
as $$
begin
  execute 'CREATE TABLE IF NOT EXISTS _dummy_selects (id serial primary key, created_at timestamptz default now())';
  execute 'INSERT INTO _dummy_selects (id) VALUES (1) ON CONFLICT DO NOTHING';
exception when others then
  raise exception '%', SQLERRM;
end;
$$; 