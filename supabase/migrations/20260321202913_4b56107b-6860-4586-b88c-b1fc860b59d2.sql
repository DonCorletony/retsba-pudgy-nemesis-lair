-- Enum for template sections
create type public.xp_template_section as enum ('pre_divider_weekly', 'post_divider_weekly', 'all_time');

-- Templates table
create table public.xp_templates (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  section xp_template_section not null,
  sort_order integer not null default 0,
  is_new boolean not null default false,
  is_default boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table public.xp_templates enable row level security;

-- Public read access for XP Card page
create policy "Anyone can view templates"
on public.xp_templates for select
to public
using (true);

-- Storage bucket for template images
insert into storage.buckets (id, name, public)
values ('xp-templates', 'xp-templates', true);

-- Public read on storage objects
create policy "Public read xp-templates"
on storage.objects for select
to public
using (bucket_id = 'xp-templates');