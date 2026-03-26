-- Index unindexed foreign keys (flagged by Supabase linter)
create index if not exists idx_rotation_challenges_challenge_id
  on rotation_challenges (challenge_id);

create index if not exists idx_rotations_challenge_id
  on rotations (challenge_id);

-- Single-call RPC to replace sequential REST inserts for rotation saves.
-- Accepts the full rotation tree as JSONB and performs all work server-side
-- in one transaction, eliminating multiple network round-trips.
create or replace function upsert_rotation(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_rotation_id uuid;
  v_map_id uuid := (payload->>'map_id')::uuid;
  v_week_start date := (payload->>'week_start')::date;
  v_credit_text text := payload->>'credit_text';
  v_existing_id uuid;
  v_round jsonb;
  v_round_id uuid;
  v_wave jsonb;
  v_wave_id uuid;
  v_spawn jsonb;
  v_challenge jsonb;
begin
  -- 1. Delete existing rotation for this map+week (cascades to all children)
  select id into v_existing_id
    from rotations
   where map_id = v_map_id and week_start = v_week_start;

  if v_existing_id is not null then
    delete from rotations where id = v_existing_id;
  end if;

  -- 2. Insert rotation
  insert into rotations (map_id, week_start, credit_text)
    values (v_map_id, v_week_start, v_credit_text)
    returning id into v_rotation_id;

  -- 3. Insert rotation_challenges
  for v_challenge in select value from jsonb_array_elements(
    coalesce(payload->'challenges', '[]'::jsonb)
  ) loop
    insert into rotation_challenges (rotation_id, challenge_id, round_number)
    values (
      v_rotation_id,
      (v_challenge->>'challenge_id')::uuid,
      (v_challenge->>'round_number')::int
    );
  end loop;

  -- 4. Insert rounds -> waves -> spawns (nested loops, all in-process)
  for v_round in select value from jsonb_array_elements(payload->'rounds') loop
    insert into rounds (rotation_id, round_number)
    values (v_rotation_id, (v_round->>'round_number')::int)
    returning id into v_round_id;

    for v_wave in select value from jsonb_array_elements(v_round->'waves') loop
      insert into waves (round_id, wave_number)
      values (v_round_id, (v_wave->>'wave_number')::int)
      returning id into v_wave_id;

      for v_spawn in select value from jsonb_array_elements(v_wave->'spawns') loop
        insert into spawns (round_id, spawn_order, location, spawn_point, element)
        values (
          v_wave_id,
          (v_spawn->>'spawn_order')::int,
          v_spawn->>'location',
          v_spawn->>'spawn_point',
          coalesce(
            (select array_agg(e::text)
             from jsonb_array_elements_text(v_spawn->'element') as e),
            '{}'::text[]
          )
        );
      end loop;
    end loop;
  end loop;

  return v_rotation_id;
end;
$$;
