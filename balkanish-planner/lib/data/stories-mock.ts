import type { BalkanishStory } from "@/lib/types";
import { synthesizeImageAsset } from "@/lib/media/normalize";

export const mockStories: BalkanishStory[] = [
  {
    id: "story-kava-kultura",
    slug: "the-coffee-that-takes-an-hour",
    title: {
      en: "The Coffee That Takes an Hour",
      de: "Der Kaffee, der eine Stunde dauert",
      it: "Il Caffè che Dura un'Ora",
      hr: "Kava koja traje sat",
    },
    body: {
      en: "In Bosnia, ordering a coffee is not a transaction. It arrives on a small tray: a džezva still hot from the sand, a cube of sugar, a glass of cold water, and a small sweet — often a lokum or a walnut piece. The sugar goes in separately; you do not stir it. You hold the cup differently. You do not look at your phone.\n\nBosanska kafa is one of the few remaining rituals that insists on presence. Bosnians drink it the same way in Sarajevo's old bazaar and in a living room in a village with no café. The ritual is the point. The caffeine is almost incidental.\n\nThere is a phrase: 'Hoćeš na kafu?' — Do you want a coffee? It means: do you want to sit with me for a while?",
      hr: "U Bosni, narudžba kave nije transakcija. Dolazi na maloj tacni: džezva još vruća od pijeska, kockica šećera, čaša hladne vode i malo slatkoga — često lokum ili komad oraha. Šećer ide zasebno; ne miješaš ga. Šalicu drži drugačije. Ne gledaš u mobitel.\n\nBosanska kava jedan je od rijetkih preostalih rituala koji inzistira na prisutnosti.",
    },
    excerpt: {
      en: "An order of coffee in Bosnia is not a transaction. It's an invitation to sit still for a while.",
      de: "Eine Kaffebestellung in Bosnien ist keine Transaktion. Es ist eine Einladung, eine Weile still zu sitzen.",
      it: "Ordinare un caffè in Bosnia non è una transazione. È un invito a stare fermi per un po'.",
      hr: "Narudžba kave u Bosni nije transakcija. To je pozivnica da malo sjedneš.",
    },
    category: "coffee_culture",
    hero_image: synthesizeImageAsset(
      "https://picsum.photos/seed/bosanska-kava/1200/800",
      "Traditional Bosnian coffee džezva on a tray"
    ),
    published_at: "2024-04-01T00:00:00Z",
    created_at: "2024-04-01T00:00:00Z",
  },
  {
    id: "story-bora-wind",
    slug: "the-bora-what-the-wind-knows",
    title: {
      en: "The Bora: What the Wind Knows",
      de: "Die Bora: Was der Wind weiß",
      it: "La Bora: Quello che Sa il Vento",
      hr: "Bura: Što zna vjetar",
    },
    body: {
      en: "The Bora arrives without announcement. A clear sky, a sudden cold — not the cold of rain but the cold of something moving at speed across hundreds of kilometres of nothing. It comes from the northeast, from the Dinaric Alps, dropping temperature by fifteen degrees in an hour.\n\nCoastal Croatians read the Bora the way sailors read water. There are named types: the Black Bora brings rain; the White Bora is dry and violent and capable of flipping a car on the Magistrala. Fishermen don't launch when the Bora is coming. The sea turns white.\n\nBut there is a kind of beauty in it. The Bora clears the air so completely that you can sometimes see the mountains of Italy from the Croatian coast. It strips the humidity. It makes everything precise. Locals call it 'the cleaning.'",
      hr: "Bura dolazi bez najave. Vedro nebo, iznenadna hladnoća — ne hladnoća kiše nego hladnoća nečeg što se kreće velikom brzinom kroz stotine kilometara ničega.",
    },
    excerpt: {
      en: "The Bora arrives without announcement and leaves the coast sharper, cleaner, and briefly visible all the way to Italy.",
      hr: "Bura dolazi bez najave i ostavlja obalu oštrijom, čišćom i nakratko vidljivom sve do Italije.",
    },
    category: "traditions",
    hero_image: synthesizeImageAsset(
      "https://picsum.photos/seed/bora-wind/1200/800",
      "Adriatic coast during a Bora wind event"
    ),
    published_at: "2024-05-15T00:00:00Z",
    created_at: "2024-05-15T00:00:00Z",
  },
];
