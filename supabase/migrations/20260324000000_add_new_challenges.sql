insert into challenges (name, description) values
  ('spirit-healing-drunk', 'Spirit Healing makes Ghosts drunk'),
  ('extremely-fast-attacks', 'Extremely fast attacks'),
  ('ghost-health-drain', 'Ghost''s Health slowly drains')
on conflict (name) do nothing;
