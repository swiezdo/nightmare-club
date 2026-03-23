alter table spawns
add column if not exists spawn_point text;

alter table spawns
drop constraint if exists spawns_spawn_point_length_check;

alter table spawns
add constraint spawns_spawn_point_length_check
check (spawn_point is null or char_length(spawn_point) <= 15);
