alter table public.children
  add column if not exists avatar_image text;

comment on column public.children.avatar_image is
  'Optional compressed square avatar image data URL generated client-side.';
