-- Sample editorial content for local development / preview environments.
-- Mirrors the mock data in lib/data/*.ts so the app looks identical whether
-- it's reading from Supabase or from the local fallback.

insert into public.destinations
  (slug, name, region, country, category, summary, description, why_we_love_it, best_season, local_score, crowd_score, slow_living_score, food_score, story_score, sunset_score, hero_image_url, is_featured)
values
  ('vis', 'Vis', 'Dalmatian Islands', 'Croatia', 'island_secrets',
   'The island the ferries forgot — and locals are quietly grateful.',
   'Closed to foreign visitors for decades as a military base, Vis missed the package-tour wave entirely. What''s left is a slow island of stone villages, vineyards, and a harbour that still smells like fish nets, not sunscreen.',
   'Vis feels like Hvar did thirty years ago. No mega-yachts, no queues for ice cream — just konobas where the owner''s mother is still cooking.',
   'Late May to mid-June, or September',
   9.2, 2.1, 9.5, 8.7, 9.0, 8.5, 'https://picsum.photos/seed/vis-island/1200/800', true),

  ('cavtat', 'Cavtat', 'Dubrovnik Riviera', 'Croatia', 'quiet_escapes',
   'Dubrovnik''s view, without Dubrovnik''s crowds.',
   'A 25-minute drive from the Old Town, Cavtat has the same limestone-and-cypress beauty with a fraction of the foot traffic. Locals go here precisely to avoid where the cruise ships dock.',
   'You get the postcard Adriatic waterfront promenade, minus the selfie-stick gridlock.',
   'May, June, September, October',
   8.6, 3.4, 7.5, 7.8, 6.5, 8.8, 'https://picsum.photos/seed/cavtat-town/1200/800', true),

  ('rovinj', 'Rovinj', 'Istria', 'Croatia', 'romantic_spots',
   'Venice''s little cousin, with better seafood and half the price.',
   'Pastel houses stacked above the harbour, a hilltop church bell tower, and the kind of golden-hour light that makes every dinner feel like an occasion.',
   'Two glasses of malvazija on a quay at sunset will tell you everything you need to know.',
   'April–June, September',
   8.8, 4.5, 6.0, 9.0, 7.5, 9.4, 'https://picsum.photos/seed/rovinj-harbour/1200/800', true),

  ('mostar', 'Mostar', 'Herzegovina', 'Bosnia and Herzegovina', 'local_favorites',
   'One bridge, one river, and a thousand years of resilience.',
   'The rebuilt Stari Most arches over the Neretva''s impossible turquoise water. Beyond the famous dive spot, the old bazaar still trades copper and coffee the way it has for centuries.',
   'It is the rare place where the history lesson and the view are the same thing.',
   'April–June, September–October',
   9.0, 4.8, 5.5, 8.0, 9.6, 7.0, 'https://picsum.photos/seed/mostar-bridge/1200/800', false),

  ('korcula', 'Korčula', 'Dalmatian Islands', 'Croatia', 'romantic_spots',
   'A walled old town on a hill, ringed by vineyards and (allegedly) Marco Polo''s birthplace.',
   'Smaller and calmer than Dubrovnik, Korčula''s old town has the same red-roof, honey-stone drama, plus some of the best skipped-the-guidebook wine on the coast.',
   'Sunset from the city walls, a glass of Pošip in hand — that''s the whole pitch.',
   'June, September',
   8.9, 4.2, 7.8, 8.2, 8.0, 9.2, 'https://picsum.photos/seed/korcula-walls/1200/800', true),

  ('plitvice', 'Plitvice Lakes', 'Central Croatia', 'Croatia', 'nature',
   'Sixteen turquoise lakes, connected by waterfalls, inside a national park.',
   'Wooden boardwalks weave between travertine pools so clear you can watch trout move beneath them. Go early or go late — midday brings the tour buses.',
   'It looks digitally enhanced. It is not.',
   'May–June, September–October',
   8.4, 6.0, 4.0, 5.5, 7.0, 4.5, 'https://picsum.photos/seed/plitvice-lakes/1200/800', false),

  ('lastovo', 'Lastovo', 'Dalmatian Islands', 'Croatia', 'island_secrets',
   'A nature park island with more chimneys than people on most days.',
   'Lastovo''s distinctive cylindrical chimneys top stone houses on a hillside that looks out over thirty-odd surrounding islets. The ferry schedule alone keeps the crowds away.',
   'If "undiscovered Croatia" still exists, this is it.',
   'June, September',
   9.4, 1.6, 9.8, 7.5, 8.5, 8.0, 'https://picsum.photos/seed/lastovo-island/1200/800', false),

  ('konavle', 'Konavle Valley', 'Dubrovnik Riviera', 'Croatia', 'family_friendly',
   'Vineyards, donkey trails, and konobas that serve five-course lunches without trying hard.',
   'A patchwork valley between Dubrovnik and Montenegro, Konavle is where Dubrovnik families go to slow down — agritourism farms, old watermills, and home-pressed olive oil.',
   'It''s the antidote to Dubrovnik''s Old Town crush, fifteen minutes away.',
   'April–October',
   8.7, 2.8, 9.0, 9.2, 7.0, 7.2, 'https://picsum.photos/seed/konavle-valley/1200/800', false),

  ('peljesac', 'Pelješac Peninsula', 'Dalmatian Coast', 'Croatia', 'local_favorites',
   'Croatia''s most serious wine country, on a knife-edge peninsula.',
   'Dingač and Postup vineyards cling to nearly vertical slopes above the sea. Oyster farms in Mali Ston add a second reason to linger.',
   'Ask any Dubrovnik local where they actually drink, and they''ll point here.',
   'May–June, September–October',
   8.9, 3.0, 8.0, 9.4, 7.8, 8.6, 'https://picsum.photos/seed/peljesac-vineyards/1200/800', false),

  ('perast', 'Perast', 'Bay of Kotor', 'Montenegro', 'romantic_spots',
   'Kotor''s view, minus Kotor''s cruise-ship tide.',
   'A single baroque street between the mountains and the bay, with two islet churches just offshore. Perast has the Bay of Kotor''s entire postcard, condensed.',
   'Best seen from a kayak, paddling out to Our Lady of the Rocks at golden hour.',
   'May, June, September',
   8.5, 3.6, 7.2, 7.0, 8.2, 9.5, 'https://picsum.photos/seed/perast-bay/1200/800', false);

insert into public.food_finds
  (slug, name, region, story, history, drink_pairing, where_to_try, hero_image_url, is_featured)
values
  ('pasticada', 'Pašticada', 'Dalmatia',
   'A Sunday dish that takes two days to make and disappears in ten minutes — Dalmatian beef braised in wine, prunes, and a spice list nobody writes down the same way twice.',
   'Said to trace back to Venetian rule of the Dalmatian coast, pašticada was historically reserved for weddings and holidays — a dish that announced an occasion mattered.',
   'A robust Plavac Mali red',
   'Family-run konobas in Split and the islands, never a hotel buffet',
   'https://picsum.photos/seed/pasticada-dish/1200/800', true),

  ('peka', 'Peka', 'Dalmatia & Istria',
   'Meat and potatoes slow-roasted under an iron bell, buried in embers for hours. You order it the day before — peka does not do "fast."',
   'A cooking method older than the modern stove, peka comes from communal village ovens where families would share the embers and the wait.',
   'A chilled Pošip or a dark local beer',
   'Inland konobas that still cook outdoors, away from the coast road',
   'https://picsum.photos/seed/peka-dish/1200/800', true),

  ('soparnik', 'Soparnik', 'Poljica, near Split',
   'A thin savoury pie of Swiss chard, olive oil, and garlic, baked directly on embers under a metal lid — Dalmatia''s answer to flatbread, and a UNESCO-recognised tradition.',
   'Dating back centuries in the Poljica region, soparnik was a Lenten dish — meat-free, but never short on flavour.',
   'A glass of local rosé',
   'Village bakeries around Poljica, especially during religious festivals',
   'https://picsum.photos/seed/soparnik-pie/1200/800', false),

  ('crni-rizot', 'Crni Rižot', 'Istria & Dalmatia',
   'Risotto turned the colour of the sea floor by cuttlefish ink, briny and rich, finished with a glug of good olive oil.',
   'A fisherman''s dish born from using every part of the catch — the ink included.',
   'A crisp Istrian Malvazija',
   'Konobas within sight of the harbour where the squid boats come in',
   'https://picsum.photos/seed/crni-rizot/1200/800', false),

  ('burek', 'Burek', 'Balkans-wide',
   'Flaky filo rolled around cheese, meat, or spinach — the breakfast (and 2am) staple of every Balkan capital.',
   'Ottoman in origin, burek spread across the Balkans and took on a different shape and filling in nearly every town.',
   'Strong Turkish-style coffee or a cold yogurt drink',
   'Bakeries, not restaurants — and always still warm',
   'https://picsum.photos/seed/burek-pastry/1200/800', true),

  ('kulen', 'Kulen', 'Slavonia',
   'A paprika-rich smoked sausage cured for months, sliced thin and eaten with bread, cheese, and very little ceremony.',
   'A Slavonian specialty often made once a year, in winter, as a household ritual rather than a recipe.',
   'A glass of Slavonian Graševina',
   'Farmhouse tables in Slavonia, sold by the kilogram at village markets',
   'https://picsum.photos/seed/kulen-sausage/1200/800', false);

insert into public.culture_notes
  (slug, title, excerpt, body, hero_image_url, region, is_featured)
values
  ('croatians-never-rush-coffee', 'Why Croatians Never Rush Coffee',
   'A coffee here is rarely about the coffee.',
   'Order a kava in any Croatian town and you''ll notice the same thing tourists often miss: nobody is in a hurry. The coffee itself, usually a small, strong espresso, is almost beside the point — it''s the ticket that buys you a table for an hour, two hours, sometimes the whole afternoon. Rushing it is read as a small social failure, not efficiency.',
   'https://picsum.photos/seed/coffee-culture/1200/800', 'Dalmatia', true),

  ('what-pomalo-means', 'What "Pomalo" Really Means',
   'Not "slowly." Closer to "in good time, and not a moment before."',
   '"Pomalo" gets translated as "slowly" or "take it easy," but that undersells it. It''s closer to a worldview: things will get done, the fish will get caught, the guests will be fed — just not on anyone else''s clock. Locals use it as advice, as an apology, and occasionally as a gentle warning.',
   'https://picsum.photos/seed/pomalo-life/1200/800', null, true),

  ('the-art-of-one-more-coffee', 'The Art of Staying for One More Coffee',
   'The best conversations in the Balkans happen on the second cup, never the first.',
   'Hospitality here has a rhythm: the first coffee is a greeting, the second is where the real talk starts, and refusing a third can feel like leaving a story unfinished. Visitors who treat coffee as a quick stop miss most of what it''s actually for.',
   'https://picsum.photos/seed/second-coffee/1200/800', null, false),

  ('rakija-as-diplomacy', 'How Rakija Became Diplomacy',
   'A shot of homemade brandy has settled more disputes than most courtrooms.',
   'Rakija — homemade fruit brandy, usually plum or grape — shows up at weddings, funerals, business deals, and chance encounters with neighbours. Refusing a glass, even a small one, can read as refusing the relationship itself. Accepting one, even badly, usually opens a door.',
   'https://picsum.photos/seed/rakija-toast/1200/800', null, true);

insert into public.secret_swaps
  (famous_name, famous_region, famous_image_url, alternative_destination_id, why_text, comparison_points)
select
  'Dubrovnik', 'Dalmatian Coast', 'https://picsum.photos/seed/dubrovnik-old-town/1200/800',
  d.id,
  'Cavtat sits on the same stretch of Adriatic coastline, twenty-five minutes south, with the same stone-and-cypress views — and none of the cruise-ship surge that floods Dubrovnik''s Old Town by mid-morning.',
  '[
    {"label": "Crowd level", "famous": "Cruise-ship peaks, 8am–4pm", "alternative": "Calm nearly all day"},
    {"label": "Walking the waterfront", "famous": "Shoulder to shoulder, July–August", "alternative": "Room to breathe"},
    {"label": "Price level", "famous": "Premium, tourist-rate", "alternative": "Noticeably lower"},
    {"label": "Distance from airport", "famous": "20 minutes", "alternative": "15 minutes"}
  ]'::jsonb
from public.destinations d where d.slug = 'cavtat'
union all
select
  'Kotor', 'Bay of Kotor', 'https://picsum.photos/seed/kotor-old-town/1200/800',
  d.id,
  'Perast has the same fjord-like bay and baroque stonework as Kotor, with one street instead of cruise-ship crowds funnelling through a walled old town.',
  '[
    {"label": "Crowd level", "famous": "Heavy, especially midday", "alternative": "Quiet, even in August"},
    {"label": "Photo ops", "famous": "Iconic, but crowded frames", "alternative": "Same bay, empty foreground"},
    {"label": "Price level", "famous": "Tourist-rate", "alternative": "Lower"}
  ]'::jsonb
from public.destinations d where d.slug = 'perast';

insert into public.premium_guides (slug, title, description, cover_image_url, price_eur, is_published)
values
  ('secret-dalmatia', 'Secret Dalmatia', 'The coastal villages, coves, and konobas that never make the top-10 lists — curated for travellers who want the Dalmatia locals actually live in.', 'https://picsum.photos/seed/secret-dalmatia/900/1200', 14.99, true),
  ('croatia-beyond-dubrovnik', 'Croatia Beyond Dubrovnik', 'A full week of itineraries that start where the cruise crowds end, built around Konavle, Pelješac, and the southern islands.', 'https://picsum.photos/seed/beyond-dubrovnik/900/1200', 14.99, true),
  ('island-hopping-croatia', 'Island Hopping Croatia', 'Ferry routes, timing, and the quiet islands worth the extra crossing — Vis, Lastovo, and beyond.', 'https://picsum.photos/seed/island-hopping/900/1200', 14.99, true),
  ('balkanish-food-guide', 'Balkanish Food Guide', 'The dishes, regions, and family konobas behind every Balkan meal worth remembering, region by region.', 'https://picsum.photos/seed/balkanish-food/900/1200', 14.99, true);
