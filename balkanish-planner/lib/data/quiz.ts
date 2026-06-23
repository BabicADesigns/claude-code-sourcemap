export type QuizResultKey = "vis" | "rovinj" | "mostar" | "korcula";

export interface QuizOption {
  text: string;
  result: QuizResultKey;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "afternoon",
    prompt: "Your ideal afternoon abroad looks like...",
    options: [
      { text: "No plan, an empty cove, and the sound of cicadas.", result: "vis" },
      { text: "A camera, golden light, and a quiet alley to wander.", result: "rovinj" },
      { text: "A wander through an old bazaar, asking questions.", result: "mostar" },
      { text: "A long lunch with new friends and too much wine.", result: "korcula" },
    ],
  },
  {
    id: "soundtrack",
    prompt: "Pick a soundtrack for your trip.",
    options: [
      { text: "Waves, and absolutely nothing else.", result: "vis" },
      { text: "Acoustic guitar drifting from a café.", result: "rovinj" },
      { text: "Call to prayer echoing over the river.", result: "mostar" },
      { text: "Live klapa singing in the town square.", result: "korcula" },
    ],
  },
  {
    id: "souvenir",
    prompt: "Your travel souvenir of choice.",
    options: [
      { text: "A jar of sea salt you harvested yourself.", result: "vis" },
      { text: "A hand-painted print of the harbour.", result: "rovinj" },
      { text: "A hammered copper coffee set.", result: "mostar" },
      { text: "A bottle of the vineyard's best Pošip.", result: "korcula" },
    ],
  },
  {
    id: "crowds",
    prompt: "How do you feel about crowds?",
    options: [
      { text: "Allergic. The fewer people, the better.", result: "vis" },
      { text: "Fine, in small and pretty doses.", result: "rovinj" },
      { text: "I want to feel the buzz of a living town.", result: "mostar" },
      { text: "I want a party — a tasteful one.", result: "korcula" },
    ],
  },
  {
    id: "pace",
    prompt: "Choose a pace.",
    options: [
      { text: "Nothing happens before noon.", result: "vis" },
      { text: "Slow mornings, golden-hour everything.", result: "rovinj" },
      { text: "I like to cover ground and learn things.", result: "mostar" },
      { text: "Long lunches into longer dinners.", result: "korcula" },
    ],
  },
  {
    id: "draw",
    prompt: "What draws you to a place?",
    options: [
      { text: "Isolation and untouched nature.", result: "vis" },
      { text: "Beauty and atmosphere.", result: "rovinj" },
      { text: "History and resilience.", result: "mostar" },
      { text: "Wine, food, and good company.", result: "korcula" },
    ],
  },
  {
    id: "evening",
    prompt: "Pick an evening plan.",
    options: [
      { text: "Watching the stars from an empty beach.", result: "vis" },
      { text: "Dinner on a candlelit terrace.", result: "rovinj" },
      { text: "Coffee with locals, talking history.", result: "mostar" },
      { text: "Wine tasting with the town's vintner.", result: "korcula" },
    ],
  },
  {
    id: "view",
    prompt: "Your dream view.",
    options: [
      { text: "A hidden cove no boat tour visits.", result: "vis" },
      { text: "Pastel rooftops at sunset.", result: "rovinj" },
      { text: "A stone bridge over a turquoise river.", result: "mostar" },
      { text: "City walls overlooking vineyards.", result: "korcula" },
    ],
  },
  {
    id: "unforgivable",
    prompt: "What's unforgivable on a trip?",
    options: [
      { text: "A rigid schedule.", result: "vis" },
      { text: "A wasted photo opportunity.", result: "rovinj" },
      { text: "Not asking the guide enough questions.", result: "mostar" },
      { text: "Leaving a glass unfinished.", result: "korcula" },
    ],
  },
  {
    id: "word",
    prompt: "Pick a word.",
    options: [
      { text: "Solitude", result: "vis" },
      { text: "Romance", result: "rovinj" },
      { text: "Story", result: "mostar" },
      { text: "Hospitality", result: "korcula" },
    ],
  },
];

export interface QuizResultProfile {
  key: QuizResultKey;
  destinationSlug: string;
  resultTitle: string;
  personalityTitle: string;
  description: string;
  traits: string[];
}

export const quizResults: Record<QuizResultKey, QuizResultProfile> = {
  vis: {
    key: "vis",
    destinationSlug: "vis",
    resultTitle: "You are Vis",
    personalityTitle: "The Quiet Wanderer",
    description:
      "You don't travel to be seen — you travel to disappear, just a little. You'd trade a famous view for an empty one, and a packed itinerary for an afternoon with nothing on it at all.",
    traits: ["Solitude-seeking", "Unhurried", "Allergic to crowds", "Finds peace in silence"],
  },
  rovinj: {
    key: "rovinj",
    destinationSlug: "rovinj",
    resultTitle: "You are Rovinj",
    personalityTitle: "The Romantic Aesthete",
    description:
      "You notice the light before you notice the time. Beauty isn't decoration for you — it's the point. You travel for golden hours, pastel facades, and the feeling of being inside a painting.",
    traits: ["Beauty-led", "Slow mornings", "Atmosphere over agenda", "A little sentimental"],
  },
  mostar: {
    key: "mostar",
    destinationSlug: "mostar",
    resultTitle: "You are Mostar",
    personalityTitle: "The Story Seeker",
    description:
      "You want the history lesson, not just the photo. You ask the guide one more question than everyone else, and you leave knowing more than you arrived with.",
    traits: ["Curious", "History-minded", "Likes a living town", "Asks too many questions, on purpose"],
  },
  korcula: {
    key: "korcula",
    destinationSlug: "korcula",
    resultTitle: "You are Korčula",
    personalityTitle: "The Old-Soul Host",
    description:
      "You measure a trip by the table, not the itinerary. Good wine, good company, and a lunch that turns into dinner — that's success, as far as you're concerned.",
    traits: ["Hospitable", "Food-and-wine-led", "Loves a long table", "Generous with time"],
  },
};
