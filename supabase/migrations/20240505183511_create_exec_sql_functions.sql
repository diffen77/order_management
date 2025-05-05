-- Create SQL execution functions for MCP server integration

-- Function to execute SQL queries and return results as JSON
create or replace function execute_sql_fetch(query_text text, params jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer -- Runs with the privileges of the function creator
as $$
declare
  result jsonb;
begin
  execute query_text into result;
  return result;
exception when others then
  return jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
end;
$$;

-- Function to execute SQL commands without returning results
create or replace function execute_sql(query_text text, params jsonb default '[]'::jsonb)
returns void
language plpgsql
security definer -- Runs with the privileges of the function creator
as $$
begin
  execute query_text;
exception when others then
  raise exception '%', SQLERRM;
end;
$$; 