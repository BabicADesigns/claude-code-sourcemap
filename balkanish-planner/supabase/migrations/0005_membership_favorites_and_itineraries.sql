-- Phase 4 — Membership Foundation: the Saved Content System adds Secret
-- Swaps to the existing polymorphic favorites table, and the AI Planner
-- Persistence feature needs owners to write (not just read) their own
-- generated itineraries.

alter table public.favorites
  drop constraint favorites_entity_type_check;
alter table public.favorites
  add constraint favorites_entity_type_check
  check (entity_type in ('destination', 'food_find', 'culture_note', 'secret_swap'));

create policy "generated_itineraries are owner writable" on public.generated_itineraries
  for insert with check (auth.uid() = user_id);
create policy "generated_itineraries are owner deletable" on public.generated_itineraries
  for delete using (auth.uid() = user_id);
