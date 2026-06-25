import type { CultureNote } from "@/lib/types";

export const mockCultureNotes: CultureNote[] = [
  {
    id: "croatians-never-rush-coffee",
    slug: "croatians-never-rush-coffee",
    title: "Why Croatians Never Rush Coffee",
    excerpt: "A coffee here is rarely about the coffee.",
    body:
      "Order a kava in any Croatian town and you'll notice the same thing tourists often miss: nobody is in a hurry. The coffee itself, usually a small, strong espresso, is almost beside the point — it's the ticket that buys you a table for an hour, two hours, sometimes the whole afternoon. Rushing it is read as a small social failure, not efficiency.",
    hero_image_url: "https://picsum.photos/seed/coffee-culture/1200/800",
    hero_image: {
      url: "https://picsum.photos/seed/coffee-culture/1200/800",
      alt: "Editorial placeholder image for the slow, unhurried ritual of Croatian coffee culture — to be replaced with real on-location photography.",
      caption: {
        en: "A kava that buys you the whole afternoon.",
        de: "Ein Kava, der dir den ganzen Nachmittag schenkt.",
        it: "Un kava che ti regala tutto il pomeriggio.",
        hr: "Kava koja ti otkupi cijelo popodne.",
      },
      credit: { photographer: "Unassigned", source: "Picsum" },
    },
    region: "Dalmatia",
    is_featured: true,
  },
  {
    id: "what-pomalo-means",
    slug: "what-pomalo-means",
    title: 'What "Pomalo" Really Means',
    excerpt: 'Not "slowly." Closer to "in good time, and not a moment before."',
    body:
      '"Pomalo" gets translated as "slowly" or "take it easy," but that undersells it. It\'s closer to a worldview: things will get done, the fish will get caught, the guests will be fed — just not on anyone else\'s clock. Locals use it as advice, as an apology, and occasionally as a gentle warning.',
    hero_image_url: "https://picsum.photos/seed/pomalo-life/1200/800",
    hero_image: {
      url: "https://picsum.photos/seed/pomalo-life/1200/800",
      alt: "Editorial placeholder image evoking the unhurried Balkan philosophy of pomalo — to be replaced with real on-location photography.",
      caption: "Pomalo — in good time, and not a moment before.",
      credit: { photographer: "Unassigned", source: "Picsum" },
    },
    region: null,
    is_featured: true,
  },
  {
    id: "the-art-of-one-more-coffee",
    slug: "the-art-of-one-more-coffee",
    title: "The Art of Staying for One More Coffee",
    excerpt: "The best conversations in the Balkans happen on the second cup, never the first.",
    body:
      "Hospitality here has a rhythm: the first coffee is a greeting, the second is where the real talk starts, and refusing a third can feel like leaving a story unfinished. Visitors who treat coffee as a quick stop miss most of what it's actually for.",
    hero_image_url: "https://picsum.photos/seed/second-coffee/1200/800",
    hero_image: {
      url: "https://picsum.photos/seed/second-coffee/1200/800",
      alt: "Editorial placeholder image of a second round of coffee, where the real conversation begins — to be replaced with real on-location photography.",
      caption: "The second cup, where the real talk starts.",
      credit: { photographer: "Unassigned", source: "Picsum" },
    },
    region: null,
    is_featured: false,
  },
  {
    id: "rakija-as-diplomacy",
    slug: "rakija-as-diplomacy",
    title: "How Rakija Became Diplomacy",
    excerpt: "A shot of homemade brandy has settled more disputes than most courtrooms.",
    body:
      "Rakija — homemade fruit brandy, usually plum or grape — shows up at weddings, funerals, business deals, and chance encounters with neighbours. Refusing a glass, even a small one, can read as refusing the relationship itself. Accepting one, even badly, usually opens a door.",
    hero_image_url: "https://picsum.photos/seed/rakija-toast/1200/800",
    hero_image: {
      url: "https://picsum.photos/seed/rakija-toast/1200/800",
      alt: "Editorial placeholder image of a shared glass of homemade rakija — to be replaced with real on-location photography.",
      caption: "Rakija, offered and accepted.",
      credit: { photographer: "Unassigned", source: "Picsum" },
    },
    region: null,
    is_featured: true,
  },
];
