-- Phase 13 — Production Data Layer: storage architecture.
--
-- Architecture only. No mass upload of existing picsum.photos placeholder
-- images is performed here — destinations/food_finds/culture_notes keep
-- reading hero_image_url / hero_image.url exactly as they do today, whether
-- that URL points at picsum.photos or at one of these buckets. Migrating
-- the actual files is a content-ops task for whenever real photography
-- replaces the placeholders (see docs/image-direction-v2.md).
--
-- Four buckets, matching the four storage needs in the Phase 13 brief:
--   destination-images — editorial hero images (destinations, food finds, culture notes)
--   gallery-images     — editorial gallery images (destination detail pages)
--   itinerary-pdfs      — generated trip PDF exports, one user's own trips only
--   user-uploads        — reserved for future user-submitted media (e.g. postcards)
--
-- Editorial buckets are public-read (the content is meant to be displayed
-- to anonymous visitors, same as today's public picsum URLs) with writes
-- left to the service role by omission of insert/update/delete policies —
-- the same "RLS enabled, no policy = service-role-only" convention used for
-- hotels/tours/experiences/restaurants in migration 0007.
--
-- The two user-scoped buckets are private and use a path-prefix ownership
-- convention: every object's key must start with `${auth.uid()}/`, enforced
-- via storage.foldername(name))[1] = auth.uid()::text. This mirrors how
-- saved_trips/generated_itineraries/postcards already scope rows by
-- user_id — here the "row" is the file path instead of a column.

insert into storage.buckets (id, name, public)
values
  ('destination-images', 'destination-images', true),
  ('gallery-images', 'gallery-images', true),
  ('itinerary-pdfs', 'itinerary-pdfs', false),
  ('user-uploads', 'user-uploads', false)
on conflict (id) do nothing;

-- Editorial buckets: anyone can read, only the service role can write.
create policy "destination-images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'destination-images');

create policy "gallery-images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

-- itinerary-pdfs: a user's exported trip PDFs, scoped to a `${user_id}/...`
-- path prefix. Nobody else — including other authenticated users — can
-- read, write, or delete another user's export.
create policy "itinerary-pdfs are owner readable"
  on storage.objects for select
  using (bucket_id = 'itinerary-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "itinerary-pdfs are owner writable"
  on storage.objects for insert
  with check (bucket_id = 'itinerary-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "itinerary-pdfs are owner deletable"
  on storage.objects for delete
  using (bucket_id = 'itinerary-pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

-- user-uploads: same owner-prefix convention, reserved for future features
-- (e.g. a user-submitted postcard photo). No upload UI exists yet — this
-- is the access-control architecture for when one is built.
create policy "user-uploads are owner readable"
  on storage.objects for select
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user-uploads are owner writable"
  on storage.objects for insert
  with check (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user-uploads are owner deletable"
  on storage.objects for delete
  using (bucket_id = 'user-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
