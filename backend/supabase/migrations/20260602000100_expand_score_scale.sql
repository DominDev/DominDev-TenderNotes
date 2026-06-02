alter table public.observations
  drop constraint if exists observations_morning_before_nursery_check,
  drop constraint if exists observations_separation_check,
  drop constraint if exists observations_nursery_info_check,
  drop constraint if exists observations_pickup_check,
  drop constraint if exists observations_after_nursery_home_check,
  drop constraint if exists observations_play_check,
  drop constraint if exists observations_parent_contact_check,
  drop constraint if exists observations_sleep_check,
  drop constraint if exists observations_food_check;

alter table public.observations
  add constraint observations_morning_before_nursery_check check (morning_before_nursery between 0 and 3),
  add constraint observations_separation_check check (separation between 0 and 3),
  add constraint observations_nursery_info_check check (nursery_info between 0 and 3),
  add constraint observations_pickup_check check (pickup between 0 and 3),
  add constraint observations_after_nursery_home_check check (after_nursery_home between 0 and 3),
  add constraint observations_play_check check (play between 0 and 3),
  add constraint observations_parent_contact_check check (parent_contact between 0 and 3),
  add constraint observations_sleep_check check (sleep between 0 and 3),
  add constraint observations_food_check check (food between 0 and 3);

update public.observations
set
  morning_before_nursery = case when morning_before_nursery = 2 then 3 else morning_before_nursery end,
  separation = case when separation = 2 then 3 else separation end,
  nursery_info = case when nursery_info = 2 then 3 else nursery_info end,
  pickup = case when pickup = 2 then 3 else pickup end,
  after_nursery_home = case when after_nursery_home = 2 then 3 else after_nursery_home end,
  play = case when play = 2 then 3 else play end,
  parent_contact = case when parent_contact = 2 then 3 else parent_contact end,
  sleep = case when sleep = 2 then 3 else sleep end,
  food = case when food = 2 then 3 else food end
where 2 in (
  morning_before_nursery,
  separation,
  nursery_info,
  pickup,
  after_nursery_home,
  play,
  parent_contact,
  sleep,
  food
);
