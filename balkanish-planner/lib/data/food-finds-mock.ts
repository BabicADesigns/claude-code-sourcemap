import type { FoodFind } from "@/lib/types";

export const mockFoodFinds: FoodFind[] = [
  {
    id: "pasticada",
    slug: "pasticada",
    name: "Pašticada",
    region: "Dalmatia",
    story:
      "A Sunday dish that takes two days to make and disappears in ten minutes — Dalmatian beef braised in wine, prunes, and a spice list nobody writes down the same way twice.",
    history:
      "Said to trace back to Venetian rule of the Dalmatian coast, pašticada was historically reserved for weddings and holidays — a dish that announced an occasion mattered.",
    drink_pairing: "A robust Plavac Mali red",
    where_to_try: "Family-run konobas in Split and the islands, never a hotel buffet",
    hero_image_url: "https://picsum.photos/seed/pasticada-dish/1200/800",
    is_featured: true,
    ritual:
      "It starts marinating on Friday. By Sunday morning, whoever's grandmother is in charge has already chased everyone out of the kitchen twice — pašticada isn't cooked so much as supervised, for two days straight, by someone who refuses help.",
    local_anecdote:
      "Ask a Splićanin for the recipe and watch them go vague on purpose. Every family insists their version — extra prunes, no prunes, a splash of vinegar nobody else uses — is the only correct one, and the argument has outlived several marriages.",
  },
  {
    id: "peka",
    slug: "peka",
    name: "Peka",
    region: "Dalmatia & Istria",
    story:
      "Meat and potatoes slow-roasted under an iron bell, buried in embers for hours. You order it the day before — peka does not do \"fast.\"",
    history:
      "A cooking method older than the modern stove, peka comes from communal village ovens where families would share the embers and the wait.",
    drink_pairing: "A chilled Pošip or a dark local beer",
    where_to_try: "Inland konobas that still cook outdoors, away from the coast road",
    hero_image_url: "https://picsum.photos/seed/peka-dish/1200/800",
    is_featured: true,
    ritual:
      "You call ahead, usually the day before, and someone starts the embers hours before you arrive — there is no version of peka made to order. Showing up hungry and unannounced is the one way to guarantee you'll be eating something else.",
    local_anecdote:
      "The iron bell goes on, gets buried in coals, and nobody touches it again until the owner decides it's ready — not the clock, not the guests. Lifting the lid early is treated roughly the way opening someone else's oven would be.",
  },
  {
    id: "soparnik",
    slug: "soparnik",
    name: "Soparnik",
    region: "Poljica, near Split",
    story:
      "A thin savoury pie of Swiss chard, olive oil, and garlic, baked directly on embers under a metal lid — Dalmatia's answer to flatbread, and a UNESCO-recognised tradition.",
    history: "Dating back centuries in the Poljica region, soparnik was a Lenten dish — meat-free, but never short on flavour.",
    drink_pairing: "A glass of local rosé",
    where_to_try: "Village bakeries around Poljica, especially during religious festivals",
    hero_image_url: "https://picsum.photos/seed/soparnik-pie/1200/800",
    is_featured: false,
    ritual:
      "Lenten fasting rules meant no meat, no eggs, no dairy — so Poljica households built a feast around chard, oil, and garlic instead, baked under embers on a metal lid the way bread was, long before anyone owned an oven.",
    local_anecdote:
      "During festivals, whole streets in Poljica smell like it at once, because everyone's grandmother decided to bake on the same afternoon. Nobody coordinates it. It just happens, every year, the same week.",
  },
  {
    id: "crni-rizot",
    slug: "crni-rizot",
    name: "Crni Rižot",
    region: "Istria & Dalmatia",
    story:
      "Risotto turned the colour of the sea floor by cuttlefish ink, briny and rich, finished with a glug of good olive oil.",
    history: "A fisherman's dish born from using every part of the catch — the ink included.",
    drink_pairing: "A crisp Istrian Malvazija",
    where_to_try: "Konobas within sight of the harbour where the squid boats come in",
    hero_image_url: "https://picsum.photos/seed/crni-rizot/1200/800",
    is_featured: false,
    ritual:
      "Nothing about the catch goes to waste, the ink included — the dish exists because someone, generations ago, refused to throw away a usable part of the cuttlefish. The black colour is the proof, not a garnish.",
    local_anecdote:
      "Order it somewhere within walking distance of a harbour and you can usually time your meal to the boats coming in — the rižot on your plate and the squid still being unloaded outside are, more often than not, from the same morning.",
  },
  {
    id: "burek",
    slug: "burek",
    name: "Burek",
    region: "Balkans-wide",
    story: "Flaky filo rolled around cheese, meat, or spinach — the breakfast (and 2am) staple of every Balkan capital.",
    history: "Ottoman in origin, burek spread across the Balkans and took on a different shape and filling in nearly every town.",
    drink_pairing: "Strong Turkish-style coffee or a cold yogurt drink",
    where_to_try: "Bakeries, not restaurants — and always still warm",
    hero_image_url: "https://picsum.photos/seed/burek-pastry/1200/800",
    is_featured: true,
    ritual:
      "There's an unwritten order of operations: cheese for breakfast, meat for lunch, whatever's left at 2am. Nobody taught this rule explicitly — you just absorb it from watching what everyone else buys and when.",
    local_anecdote:
      "Every city in the region insists its bakery does it best, and every city is visibly wrong about at least one other city's burek. It is one of the few arguments where everyone is allowed to be a little bit right.",
  },
  {
    id: "kulen",
    slug: "kulen",
    name: "Kulen",
    region: "Slavonia",
    story: "A paprika-rich smoked sausage cured for months, sliced thin and eaten with bread, cheese, and very little ceremony.",
    history: "A Slavonian specialty often made once a year, in winter, as a household ritual rather than a recipe.",
    drink_pairing: "A glass of Slavonian Graševina",
    where_to_try: "Farmhouse tables in Slavonia, sold by the kilogram at village markets",
    hero_image_url: "https://picsum.photos/seed/kulen-sausage/1200/800",
    is_featured: false,
    ritual:
      "Pig-slaughter season, once a year, in winter — whole extended families show up to help, because making kulen properly is a multi-day job nobody manages alone. It's closer to a household event than a recipe.",
    local_anecdote:
      "Households quietly keep score on whose kulen turned out better that year, comparing smoke, spice, and how long it hung curing. The comparing rarely happens out loud. The tasting, somehow, always does.",
  },
];
