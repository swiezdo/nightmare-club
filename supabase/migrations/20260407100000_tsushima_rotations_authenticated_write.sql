-- Allow authenticated admin (Supabase Auth session) to upsert Tsushima rotations via RPC + direct table access.
create policy "Authenticated insert" on tsushima_rotations for insert to authenticated with check (true);

create policy "Authenticated update" on tsushima_rotations for update to authenticated using (true) with check (true);

create policy "Authenticated delete" on tsushima_rotations for delete to authenticated using (true);

grant execute on function public.upsert_tsushima_rotation(jsonb) to authenticated;
