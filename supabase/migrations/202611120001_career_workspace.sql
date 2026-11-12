-- Apply once in Supabase SQL Editor (project owner). Never paste credentials into this file.
begin;
create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check (char_length(display_name)<=100),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.resumes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 160), extracted_text text not null check(char_length(extracted_text) between 100 and 24000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.resume_analyses (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 resume_id uuid, title text not null, report jsonb not null check(jsonb_typeof(report)='object'),
 score smallint not null check(score between 0 and 100), is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(resume_id,user_id) references public.resumes(id,user_id) on delete cascade
);
create table public.job_matches (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 resume_id uuid, title text not null, report jsonb not null check(jsonb_typeof(report)='object'),
 score smallint not null check(score between 0 and 100), is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(resume_id,user_id) references public.resumes(id,user_id) on delete cascade
);
create table public.interview_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null, report jsonb not null default '{}'::jsonb, score smallint check(score between 0 and 100), is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.interview_answers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null, question_index integer not null check(question_index>=0), question text not null, answer text not null default '', feedback jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(session_id,user_id) references public.interview_sessions(id,user_id) on delete cascade, unique(session_id,question_index)
);
create table public.cover_letters (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null, report jsonb not null default '{}'::jsonb, content text not null default '', is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.career_roadmaps (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null, report jsonb not null default '{}'::jsonb, is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.roadmap_tasks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 roadmap_id uuid not null, title text not null, completed boolean not null default false, position integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(roadmap_id,user_id) references public.career_roadmaps(id,user_id) on delete cascade
);
create table public.usage_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 feature text not null check(feature in ('resume','job-match','interview','cover-letter','roadmap','extract')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Explicit privileges plus RLS: public/anon never receive private data access.
do $$ declare name text; begin
 foreach name in array array['profiles','resumes','resume_analyses','job_matches','interview_sessions','interview_answers','cover_letters','career_roadmaps','roadmap_tasks','usage_events'] loop
  execute format('alter table public.%I enable row level security',name);
  execute format('revoke all on public.%I from anon',name);
  execute format('grant select,insert,update,delete on public.%I to authenticated',name);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',name);
  if name='profiles' then
   execute 'create policy own_profile on public.profiles for all to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id)';
  else
   execute format('create policy own_records on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',name);
   execute format('create index %I on public.%I(user_id,created_at desc)',name||'_owner_date',name);
  end if;
 end loop;
end $$;
create index interview_answers_session on public.interview_answers(session_id,user_id);
create index roadmap_tasks_roadmap on public.roadmap_tasks(roadmap_id,user_id);

create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id) values(new.id) on conflict do nothing; return new; end; $$;
revoke all on function public.create_profile() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;

-- This narrow RPC deletes only the authenticated caller, cascading all app data.
-- No client-supplied user ID and no service-role key in the application.
create function public.delete_own_account() returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
 if caller is null then raise exception 'Authentication required'; end if;
 delete from auth.users where id=caller;
end; $$;
revoke all on function public.delete_own_account() from public,anon;
grant execute on function public.delete_own_account() to authenticated;
commit;
