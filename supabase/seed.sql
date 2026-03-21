-- Seed data: Rotations for all four maps for the current week.
-- Hidden Temple includes attunements; the others have empty element arrays.
-- Run this AFTER schema.sql in the Supabase SQL Editor.

do $$
declare
  v_map_id uuid;
  v_rotation_id uuid;
  v_round_id uuid;
  v_wave_id uuid;
  v_challenge_id uuid;
  v_week_start date;
begin
  -- Calculate most recent Saturday
  v_week_start := current_date - ((extract(dow from current_date)::int + 1) % 7);

  -- Get challenge ID
  select id into v_challenge_id from challenges where name = 'lose-location';

  -- ============================================================
  -- Hidden Temple (with attunements + challenge)
  -- ============================================================
  select id into v_map_id from maps where slug = 'hidden-temple';

  insert into rotations (map_id, week_start, challenge_id)
    values (v_map_id, v_week_start, v_challenge_id)
    returning id into v_rotation_id;

  -- Stage 1
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 1) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Sun}'),
    (v_wave_id, 2, 'Cemetery', '{Moon}'),
    (v_wave_id, 3, 'Courtyard', '{Storm}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Sun}'),
    (v_wave_id, 2, 'Pagoda', '{Storm}'),
    (v_wave_id, 3, 'Cemetery', '{Moon}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Storm}'),
    (v_wave_id, 2, 'Courtyard', '{Sun}'),
    (v_wave_id, 3, 'Pagoda', '{Moon}');

  -- Stage 2
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 2) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Moon}'),
    (v_wave_id, 2, 'Courtyard', '{Sun}'),
    (v_wave_id, 3, 'Cemetery', '{Storm}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Sun}'),
    (v_wave_id, 2, 'Pagoda', '{Moon}'),
    (v_wave_id, 3, 'Courtyard', '{Storm}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Moon}'),
    (v_wave_id, 2, 'Cemetery', '{Sun}'),
    (v_wave_id, 3, 'Pagoda', '{Storm}');

  -- Stage 3
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 3) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Sun}'),
    (v_wave_id, 2, 'Pagoda', '{Storm}'),
    (v_wave_id, 3, 'Courtyard', '{Moon}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Moon}'),
    (v_wave_id, 2, 'Courtyard', '{Storm}'),
    (v_wave_id, 3, 'Cemetery', '{Sun}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Storm}'),
    (v_wave_id, 2, 'Cemetery', '{Moon}'),
    (v_wave_id, 3, 'Pagoda', '{Sun}');

  -- Stage 4 (3 waves, 4 spawns)
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 4) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Sun}'),
    (v_wave_id, 2, 'Cemetery', '{Moon}'),
    (v_wave_id, 3, 'Courtyard', '{Storm}'),
    (v_wave_id, 4, 'Pagoda', '{Moon}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Moon}'),
    (v_wave_id, 2, 'Pagoda', '{Storm}'),
    (v_wave_id, 3, 'Cemetery', '{Sun}'),
    (v_wave_id, 4, 'Courtyard', '{Sun}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Storm}'),
    (v_wave_id, 2, 'Courtyard', '{Sun}'),
    (v_wave_id, 3, 'Pagoda', '{Moon}'),
    (v_wave_id, 4, 'Cemetery', '{Storm}');

  -- ============================================================
  -- Frozen Valley (no attunements, no challenge)
  -- ============================================================
  select id into v_map_id from maps where slug = 'frozen-valley';

  insert into rotations (map_id, week_start)
    values (v_map_id, v_week_start)
    returning id into v_rotation_id;

  -- Stage 1
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 1) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Waterfall', '{}'),
    (v_wave_id, 2, 'Hillside', '{}'),
    (v_wave_id, 3, 'Armory', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Armory', '{}'),
    (v_wave_id, 2, 'Waterfall', '{}'),
    (v_wave_id, 3, 'Hillside', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Hillside', '{}'),
    (v_wave_id, 2, 'Armory', '{}'),
    (v_wave_id, 3, 'Waterfall', '{}');

  -- Stage 2
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 2) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Hillside', '{}'),
    (v_wave_id, 2, 'Armory', '{}'),
    (v_wave_id, 3, 'Waterfall', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Waterfall', '{}'),
    (v_wave_id, 2, 'Hillside', '{}'),
    (v_wave_id, 3, 'Armory', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Armory', '{}'),
    (v_wave_id, 2, 'Waterfall', '{}'),
    (v_wave_id, 3, 'Hillside', '{}');

  -- Stage 3
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 3) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Waterfall', '{}'),
    (v_wave_id, 2, 'Armory', '{}'),
    (v_wave_id, 3, 'Hillside', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Hillside', '{}'),
    (v_wave_id, 2, 'Waterfall', '{}'),
    (v_wave_id, 3, 'Armory', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Armory', '{}'),
    (v_wave_id, 2, 'Hillside', '{}'),
    (v_wave_id, 3, 'Waterfall', '{}');

  -- Stage 4 (3 waves, 4 spawns)
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 4) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Waterfall', '{}'),
    (v_wave_id, 2, 'Hillside', '{}'),
    (v_wave_id, 3, 'Armory', '{}'),
    (v_wave_id, 4, 'Waterfall', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Armory', '{}'),
    (v_wave_id, 2, 'Waterfall', '{}'),
    (v_wave_id, 3, 'Hillside', '{}'),
    (v_wave_id, 4, 'Armory', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Hillside', '{}'),
    (v_wave_id, 2, 'Armory', '{}'),
    (v_wave_id, 3, 'Waterfall', '{}'),
    (v_wave_id, 4, 'Hillside', '{}');

  -- ============================================================
  -- Broken Castle (no attunements, no challenge)
  -- ============================================================
  select id into v_map_id from maps where slug = 'broken-castle';

  insert into rotations (map_id, week_start)
    values (v_map_id, v_week_start)
    returning id into v_rotation_id;

  -- Stage 1
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 1) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Foundry', '{}'),
    (v_wave_id, 2, 'Burned Garden', '{}'),
    (v_wave_id, 3, 'Keep', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Keep', '{}'),
    (v_wave_id, 2, 'Foundry', '{}'),
    (v_wave_id, 3, 'Burned Garden', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Burned Garden', '{}'),
    (v_wave_id, 2, 'Keep', '{}'),
    (v_wave_id, 3, 'Foundry', '{}');

  -- Stage 2
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 2) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Keep', '{}'),
    (v_wave_id, 2, 'Burned Garden', '{}'),
    (v_wave_id, 3, 'Foundry', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Foundry', '{}'),
    (v_wave_id, 2, 'Keep', '{}'),
    (v_wave_id, 3, 'Burned Garden', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Burned Garden', '{}'),
    (v_wave_id, 2, 'Foundry', '{}'),
    (v_wave_id, 3, 'Keep', '{}');

  -- Stage 3
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 3) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Foundry', '{}'),
    (v_wave_id, 2, 'Keep', '{}'),
    (v_wave_id, 3, 'Burned Garden', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Keep', '{}'),
    (v_wave_id, 2, 'Burned Garden', '{}'),
    (v_wave_id, 3, 'Foundry', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Burned Garden', '{}'),
    (v_wave_id, 2, 'Foundry', '{}'),
    (v_wave_id, 3, 'Keep', '{}');

  -- Stage 4 (3 waves, 4 spawns)
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 4) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Keep', '{}'),
    (v_wave_id, 2, 'Foundry', '{}'),
    (v_wave_id, 3, 'Burned Garden', '{}'),
    (v_wave_id, 4, 'Keep', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Burned Garden', '{}'),
    (v_wave_id, 2, 'Keep', '{}'),
    (v_wave_id, 3, 'Foundry', '{}'),
    (v_wave_id, 4, 'Burned Garden', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Foundry', '{}'),
    (v_wave_id, 2, 'Burned Garden', '{}'),
    (v_wave_id, 3, 'Keep', '{}'),
    (v_wave_id, 4, 'Foundry', '{}');

  -- ============================================================
  -- River Village (no attunements, with challenge)
  -- ============================================================
  select id into v_map_id from maps where slug = 'river-village';

  insert into rotations (map_id, week_start, challenge_id)
    values (v_map_id, v_week_start, v_challenge_id)
    returning id into v_rotation_id;

  -- Stage 1
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 1) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Beach', '{}'),
    (v_wave_id, 2, 'Rice Paddies', '{}'),
    (v_wave_id, 3, 'Village', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Village', '{}'),
    (v_wave_id, 2, 'Beach', '{}'),
    (v_wave_id, 3, 'Rice Paddies', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Rice Paddies', '{}'),
    (v_wave_id, 2, 'Village', '{}'),
    (v_wave_id, 3, 'Beach', '{}');

  -- Stage 2
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 2) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Village', '{}'),
    (v_wave_id, 2, 'Rice Paddies', '{}'),
    (v_wave_id, 3, 'Beach', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Beach', '{}'),
    (v_wave_id, 2, 'Village', '{}'),
    (v_wave_id, 3, 'Rice Paddies', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Rice Paddies', '{}'),
    (v_wave_id, 2, 'Beach', '{}'),
    (v_wave_id, 3, 'Village', '{}');

  -- Stage 3
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 3) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Beach', '{}'),
    (v_wave_id, 2, 'Village', '{}'),
    (v_wave_id, 3, 'Rice Paddies', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Rice Paddies', '{}'),
    (v_wave_id, 2, 'Beach', '{}'),
    (v_wave_id, 3, 'Village', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Village', '{}'),
    (v_wave_id, 2, 'Rice Paddies', '{}'),
    (v_wave_id, 3, 'Beach', '{}');

  -- Stage 4 (3 waves, 4 spawns)
  insert into rounds (rotation_id, round_number) values (v_rotation_id, 4) returning id into v_round_id;

  insert into waves (round_id, wave_number) values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Beach', '{}'),
    (v_wave_id, 2, 'Village', '{}'),
    (v_wave_id, 3, 'Rice Paddies', '{}'),
    (v_wave_id, 4, 'Beach', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Rice Paddies', '{}'),
    (v_wave_id, 2, 'Beach', '{}'),
    (v_wave_id, 3, 'Village', '{}'),
    (v_wave_id, 4, 'Rice Paddies', '{}');

  insert into waves (round_id, wave_number) values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_order, location, element) values
    (v_wave_id, 1, 'Village', '{}'),
    (v_wave_id, 2, 'Rice Paddies', '{}'),
    (v_wave_id, 3, 'Beach', '{}'),
    (v_wave_id, 4, 'Village', '{}');

end $$;
