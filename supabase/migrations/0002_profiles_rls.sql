-- Harden profiles access with RLS policies.

alter table profiles enable row level security;

create policy if not exists "profiles_select_self"
  on profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy if not exists "profiles_insert_self"
  on profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy if not exists "profiles_update_self"
  on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy if not exists "profiles_admin_update"
  on profiles
  for update
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
  )
  with check (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
  );

create policy if not exists "profiles_admin_delete"
  on profiles
  for delete
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false)
  );
