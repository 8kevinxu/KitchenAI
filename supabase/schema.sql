-- KitchenAI schema. Run this in the Supabase SQL Editor (one time).
-- Designed "user-ready": every table carries a user_id (defaulting to 'demo'
-- for the current single shared dataset). Adding real accounts later means
-- swapping the demo id for auth.uid() and tightening the policies below.

-- Pantry inventory ---------------------------------------------------------
create table if not exists inventory (
  user_id    text not null default 'demo',
  id         text not null,
  name       text not null,
  emoji      text not null,
  status     text,
  low_stock  boolean not null default false,
  category   text not null,
  added_on   date,                 -- purchase date; drives live expiry (shelf life is recomputed client-side)
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Already have an inventory table from an earlier version? Add the new column:
--   alter table inventory add column if not exists added_on date;

-- Saved recipes ------------------------------------------------------------
create table if not exists saved_recipes (
  user_id    text not null default 'demo',
  recipe_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Grocery-list check state -------------------------------------------------
create table if not exists grocery_checked (
  user_id  text not null default 'demo',
  item_id  text not null,
  checked  boolean not null default true,
  primary key (user_id, item_id)
);

-- Row Level Security -------------------------------------------------------
-- For the shared demo dataset we allow the anon key full access. When we add
-- accounts, replace these with policies like:  using (user_id = auth.uid()).
alter table inventory       enable row level security;
alter table saved_recipes   enable row level security;
alter table grocery_checked enable row level security;

create policy "demo full access" on inventory
  for all using (true) with check (true);
create policy "demo full access" on saved_recipes
  for all using (true) with check (true);
create policy "demo full access" on grocery_checked
  for all using (true) with check (true);
