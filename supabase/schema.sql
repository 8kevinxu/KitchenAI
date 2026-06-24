-- KitchenAI schema. Run this in the Supabase SQL Editor (one time).
-- Every table carries a user_id that defaults to the signed-in user
-- (auth.uid()), and Row Level Security restricts each row to its owner.

-- Pantry inventory ---------------------------------------------------------
create table if not exists inventory (
  user_id    text not null default (auth.uid())::text,
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

-- Saved recipes ------------------------------------------------------------
create table if not exists saved_recipes (
  user_id    text not null default (auth.uid())::text,
  recipe_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- Grocery-list check state -------------------------------------------------
create table if not exists grocery_checked (
  user_id  text not null default (auth.uid())::text,
  item_id  text not null,
  checked  boolean not null default true,
  primary key (user_id, item_id)
);

-- Row Level Security -------------------------------------------------------
-- Each user can only see and write their own rows.
alter table inventory       enable row level security;
alter table saved_recipes   enable row level security;
alter table grocery_checked enable row level security;

create policy "own rows" on inventory
  for all using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
create policy "own rows" on saved_recipes
  for all using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
create policy "own rows" on grocery_checked
  for all using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);

-- Upgrading from the earlier shared-demo schema? Run this migration to swap the
-- permissive policies for per-user ones and update the defaults:
--
--   alter table inventory       alter column user_id set default (auth.uid())::text;
--   alter table saved_recipes   alter column user_id set default (auth.uid())::text;
--   alter table grocery_checked alter column user_id set default (auth.uid())::text;
--
--   drop policy if exists "demo full access" on inventory;
--   drop policy if exists "demo full access" on saved_recipes;
--   drop policy if exists "demo full access" on grocery_checked;
--   create policy "own rows" on inventory
--     for all using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
--   create policy "own rows" on saved_recipes
--     for all using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
--   create policy "own rows" on grocery_checked
--     for all using (user_id = (auth.uid())::text) with check (user_id = (auth.uid())::text);
--
-- Old shared rows (user_id = 'demo') stay in the tables but become invisible to
-- signed-in users; delete them with:  delete from inventory where user_id = 'demo';
