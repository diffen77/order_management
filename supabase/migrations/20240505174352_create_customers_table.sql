-- Create customers table for storing customer information
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  address text,
  postal_code text,
  city text,
  customer_type text not null default 'regular' check (customer_type in ('regular', 'wholesale', 'VIP')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Setup RLS (Row Level Security)
alter table public.customers enable row level security;

-- Setup policies for different operations
create policy "Customers are viewable by authenticated users" 
on public.customers for select 
to authenticated 
using (true);

create policy "Customers can be created by authenticated users" 
on public.customers for insert 
to authenticated 
with check (true);

create policy "Customers can be updated by authenticated users" 
on public.customers for update
to authenticated 
using (true);

create policy "Customers can be deleted by authenticated users" 
on public.customers for delete
to authenticated 
using (true);

-- Create notes table for customer communication tracking
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  content text not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

-- Setup RLS for customer notes
alter table public.customer_notes enable row level security;

create policy "Customer notes are viewable by authenticated users" 
on public.customer_notes for select 
to authenticated 
using (true);

create policy "Customer notes can be created by authenticated users" 
on public.customer_notes for insert 
to authenticated 
with check (true);

create policy "Customer notes can be updated by authenticated users" 
on public.customer_notes for update
to authenticated 
using (true);

create policy "Customer notes can be deleted by authenticated users" 
on public.customer_notes for delete
to authenticated 
using (true);

-- Create preferences table for customer preferences
create table if not exists public.customer_preferences (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  preferences jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Setup RLS for customer preferences
alter table public.customer_preferences enable row level security;

create policy "Customer preferences are viewable by authenticated users" 
on public.customer_preferences for select 
to authenticated 
using (true);

create policy "Customer preferences can be created by authenticated users" 
on public.customer_preferences for insert 
to authenticated 
with check (true);

create policy "Customer preferences can be updated by authenticated users" 
on public.customer_preferences for update
to authenticated 
using (true);

-- Add function to automatically update updated_at timestamp
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger for customers table
create trigger update_customers_updated_at
before update on public.customers
for each row
execute function public.update_modified_column();

-- Add trigger for customer_preferences table
create trigger update_customer_preferences_updated_at
before update on public.customer_preferences
for each row
execute function public.update_modified_column(); 