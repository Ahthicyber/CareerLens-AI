-- Apply AFTER 202611120001. Additive migration; does not remove existing data.
begin;
alter table public.roadmap_tasks add column task_key text;
create unique index roadmap_tasks_key on public.roadmap_tasks(roadmap_id,task_key);

-- Security invoker retains all existing ownership policies. Each call is atomic.
create function public.save_career_artifact(p_kind text,p_title text,p_report jsonb,p_is_demo boolean)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare caller uuid:=auth.uid(); artifact uuid; entry jsonb; milestone jsonb; task jsonb; idx integer:=0;
begin
 if caller is null then raise exception 'Authentication required'; end if;
 if p_title is null or char_length(p_title) not between 1 and 160 or jsonb_typeof(p_report)<>'object' then raise exception 'Invalid report'; end if;
 if p_kind='interview' then
  if jsonb_typeof(p_report->'answers')<>'array' or jsonb_array_length(p_report->'answers') not in (5,10) then raise exception 'Invalid answers'; end if;
  insert into public.interview_sessions(user_id,title,report,score,is_demo)
   values(caller,p_title,p_report,(p_report#>>'{evaluation,overall}')::smallint,p_is_demo) returning id into artifact;
  for entry in select value from jsonb_array_elements(p_report->'answers') loop
   insert into public.interview_answers(user_id,session_id,question_index,question,answer,feedback)
    values(caller,artifact,idx,entry->>'question',entry->>'answer',
      (select value from jsonb_array_elements(p_report#>'{evaluation,feedback}') where value->>'questionId'=entry->>'id' limit 1));
   idx:=idx+1;
  end loop;
 elsif p_kind='roadmap' then
  if jsonb_typeof(p_report->'milestones')<>'array' or jsonb_array_length(p_report->'milestones') not between 1 and 24 then raise exception 'Invalid milestones'; end if;
  insert into public.career_roadmaps(user_id,title,report,is_demo) values(caller,p_title,p_report,p_is_demo) returning id into artifact;
  for milestone in select value from jsonb_array_elements(p_report->'milestones') loop
   for task in select value from jsonb_array_elements(milestone->'tasks') loop
    insert into public.roadmap_tasks(user_id,roadmap_id,title,task_key,completed,position)
     values(caller,artifact,task->>'title',task->>'id',(task->>'completed')::boolean,idx);
    idx:=idx+1;
   end loop;
  end loop;
 else raise exception 'Unsupported artifact'; end if;
 return artifact;
end; $$;
revoke all on function public.save_career_artifact(text,text,jsonb,boolean) from public,anon;
grant execute on function public.save_career_artifact(text,text,jsonb,boolean) to authenticated;

create function public.set_roadmap_task_completed(p_roadmap_id uuid,p_task_key text,p_completed boolean)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare saved jsonb; milestone jsonb; task jsonb; mi integer:=0; ti integer; found_task boolean:=false;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_completed is null then raise exception 'Completion value required'; end if;
 -- Serializes concurrent changes to different tasks so no completed task is lost.
 select report into saved from public.career_roadmaps where id=p_roadmap_id and user_id=auth.uid() for update;
 if not found then raise exception 'Roadmap not found'; end if;
 for milestone in select value from jsonb_array_elements(saved->'milestones') loop
  ti:=0;
  for task in select value from jsonb_array_elements(milestone->'tasks') loop
   if task->>'id'=p_task_key then
    saved:=jsonb_set(saved,array['milestones',mi::text,'tasks',ti::text,'completed'],to_jsonb(p_completed));found_task:=true;
   end if;
   ti:=ti+1;
  end loop;
  mi:=mi+1;
 end loop;
 if not found_task then raise exception 'Task not found'; end if;
 update public.roadmap_tasks set completed=p_completed where roadmap_id=p_roadmap_id and task_key=p_task_key and user_id=auth.uid();
 if not found then raise exception 'Task record not found'; end if;
 update public.career_roadmaps set report=saved where id=p_roadmap_id and user_id=auth.uid();
 return saved;
end; $$;
revoke all on function public.set_roadmap_task_completed(uuid,text,boolean) from public,anon;
grant execute on function public.set_roadmap_task_completed(uuid,text,boolean) to authenticated;
commit;
