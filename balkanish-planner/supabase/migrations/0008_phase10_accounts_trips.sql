-- Phase 10 — User Accounts + Saved Trips. Additive only: existing columns,
-- tables, and policies are untouched.

-- Language awareness: the locale a user signed up with / has chosen,
-- independent of the NEXT_LOCALE cookie that drives the anonymous UI.
alter table public.profiles
  add column preferred_language text not null default 'en'
  check (preferred_language in ('en', 'de', 'it', 'hr'));

-- Saved Trips renaming: a user-chosen label, distinct from the AI-generated
-- trip_title baked into itinerary_json. Null means "use itinerary_json.trip_title".
alter table public.generated_itineraries
  add column title text;

-- The owner-insert/owner-delete policies for generated_itineraries were added
-- in 0005; renaming a saved trip needs owner-update too.
create policy "generated_itineraries are owner updatable" on public.generated_itineraries
  for update using (auth.uid() = user_id);

-- Seed preferred_language at signup from the NEXT_LOCALE-derived value the
-- client passes in auth.signUp's options.data (see components/auth/auth-form.tsx).
-- Falls back to the column default ('en') when absent or invalid.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case
      when new.raw_user_meta_data ->> 'preferred_language' in ('en', 'de', 'it', 'hr')
        then new.raw_user_meta_data ->> 'preferred_language'
      else 'en'
    end
  );
  return new;
end;
$$;
