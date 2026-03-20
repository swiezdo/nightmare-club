-- Example seed data: Full Hidden Temple rotation for the current week
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

  -- Get map and challenge IDs
  select id into v_map_id from maps where slug = 'hidden-temple';
  select id into v_challenge_id from challenges where name = 'lose-location';

  -- Create rotation
  insert into rotations (map_id, week_start, challenge_id)
    values (v_map_id, v_week_start, v_challenge_id)
    returning id into v_rotation_id;

  -- ========== Stage 1 (3 spawns per wave) ==========
  insert into rounds (rotation_id, round_number)
    values (v_rotation_id, 1)
    returning id into v_round_id;

  -- Wave 1
  insert into waves (round_id, wave_number)
    values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Sun}'),
    (v_wave_id, 2, 'Cemetery', '{Moon}'),
    (v_wave_id, 3, 'Courtyard', '{Storm}');

  -- Wave 2
  insert into waves (round_id, wave_number)
    values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Sun}'),
    (v_wave_id, 2, 'Pagoda', '{Storm}'),
    (v_wave_id, 3, 'Cemetery', '{Moon}');

  -- Wave 3
  insert into waves (round_id, wave_number)
    values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Storm}'),
    (v_wave_id, 2, 'Courtyard', '{Sun}'),
    (v_wave_id, 3, 'Pagoda', '{Moon}');

  -- ========== Stage 2 ==========
  insert into rounds (rotation_id, round_number)
    values (v_rotation_id, 2)
    returning id into v_round_id;

  -- Wave 1
  insert into waves (round_id, wave_number)
    values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Moon}'),
    (v_wave_id, 2, 'Courtyard', '{Sun}'),
    (v_wave_id, 3, 'Cemetery', '{Storm}');

  -- Wave 2
  insert into waves (round_id, wave_number)
    values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Sun}'),
    (v_wave_id, 2, 'Pagoda', '{Moon}'),
    (v_wave_id, 3, 'Courtyard', '{Storm}');

  -- Wave 3
  insert into waves (round_id, wave_number)
    values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Moon}'),
    (v_wave_id, 2, 'Cemetery', '{Sun}'),
    (v_wave_id, 3, 'Pagoda', '{Storm}');

  -- ========== Stage 3 ==========
  insert into rounds (rotation_id, round_number)
    values (v_rotation_id, 3)
    returning id into v_round_id;

  -- Wave 1
  insert into waves (round_id, wave_number)
    values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Sun}'),
    (v_wave_id, 2, 'Pagoda', '{Storm}'),
    (v_wave_id, 3, 'Courtyard', '{Moon}');

  -- Wave 2
  insert into waves (round_id, wave_number)
    values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Moon}'),
    (v_wave_id, 2, 'Courtyard', '{Storm}'),
    (v_wave_id, 3, 'Cemetery', '{Sun}');

  -- Wave 3
  insert into waves (round_id, wave_number)
    values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Storm}'),
    (v_wave_id, 2, 'Cemetery', '{Moon}'),
    (v_wave_id, 3, 'Pagoda', '{Sun}');

  -- ========== Stage 4 (4 spawns per wave) ==========
  insert into rounds (rotation_id, round_number)
    values (v_rotation_id, 4)
    returning id into v_round_id;

  -- Wave 1
  insert into waves (round_id, wave_number)
    values (v_round_id, 1) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Pagoda', '{Sun}'),
    (v_wave_id, 2, 'Cemetery', '{Moon}'),
    (v_wave_id, 3, 'Courtyard', '{Storm}'),
    (v_wave_id, 4, 'Pagoda', '{Moon}');

  -- Wave 2
  insert into waves (round_id, wave_number)
    values (v_round_id, 2) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Courtyard', '{Moon}'),
    (v_wave_id, 2, 'Pagoda', '{Storm}'),
    (v_wave_id, 3, 'Cemetery', '{Sun}'),
    (v_wave_id, 4, 'Courtyard', '{Sun}');

  -- Wave 3
  insert into waves (round_id, wave_number)
    values (v_round_id, 3) returning id into v_wave_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_wave_id, 1, 'Cemetery', '{Storm}'),
    (v_wave_id, 2, 'Courtyard', '{Sun}'),
    (v_wave_id, 3, 'Pagoda', '{Moon}'),
    (v_wave_id, 4, 'Cemetery', '{Storm}');

end $$;
