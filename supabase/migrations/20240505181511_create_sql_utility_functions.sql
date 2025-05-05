-- Create SQL utility functions for backend database access

-- Function to execute a SQL query and return rows
create or replace function execute_sql_fetch(query_text text, params jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
  query_with_params text;
  param_values text[];
  i integer;
begin
  -- Convert jsonb array to text array for parameters
  if jsonb_array_length(params) > 0 then
    param_values := array_fill(null::text, array[jsonb_array_length(params)]);
    for i in 0..jsonb_array_length(params)-1 loop
      param_values[i+1] := params->>i;
    end loop;
  end if;
  
  -- Execute the query dynamically with parameters
  execute format('select jsonb_agg(to_jsonb(t)) from (%s) t', query_text) 
  using variadic param_values
  into result;
  
  return coalesce(result, '[]'::jsonb);
exception when others then
  raise exception 'Error executing SQL: % (query: %)', sqlerrm, query_text;
end;
$$;

-- Function to execute a SQL command without returning rows
create or replace function execute_sql(query_text text, params jsonb default '[]'::jsonb)
returns void
language plpgsql
security definer
as $$
declare
  param_values text[];
  i integer;
begin
  -- Convert jsonb array to text array for parameters
  if jsonb_array_length(params) > 0 then
    param_values := array_fill(null::text, array[jsonb_array_length(params)]);
    for i in 0..jsonb_array_length(params)-1 loop
      param_values[i+1] := params->>i;
    end loop;
  end if;
  
  -- Execute the command dynamically with parameters
  execute query_text using variadic param_values;
exception when others then
  raise exception 'Error executing SQL: % (query: %)', sqlerrm, query_text;
end;
$$;

-- Grant execution privileges
grant execute on function execute_sql_fetch to authenticated;
grant execute on function execute_sql to authenticated; 