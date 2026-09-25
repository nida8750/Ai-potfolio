-- Keep the site owner as ADMIN even after other profiles exist.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
begin
  if lower(coalesce(new.email, '')) = 'nidaasghar8750@gmail.com' then
    next_role := 'ADMIN';
  elsif exists (select 1 from public.profiles) then
    next_role := 'USER';
  else
    next_role := 'ADMIN';
  end if;

  insert into public.profiles (id, email, name, phone, role, status)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'user'), '@', 1)),
    nullif(new.raw_user_meta_data->>'phone', ''),
    next_role,
    'active'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

update public.profiles
set
  role = 'ADMIN',
  name = 'nida',
  phone = '+923066644221',
  status = 'active',
  updated_at = now()
where lower(email) = 'nidaasghar8750@gmail.com';
