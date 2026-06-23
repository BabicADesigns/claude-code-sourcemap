/** Short, opinionated lines that capture how the Balkans actually work. Static editorial copy — not user data. */
export const balkanishTruths: string[] = [
  "If a local says five minutes, make yourself a coffee.",
  "Some places are destinations. Some places are invitations.",
  "Pomalo is not slow. Pomalo is correct.",
  "The best meal on the trip won't have a name on the door.",
  "A view this good usually means the parking was terrible. Walk anyway.",
  "If the konoba has a laminated menu in four languages, keep walking.",
  "Nobody's grandmother has ever been in a rush, and her cooking proves she was right not to be.",
  "The ferry schedule is not a suggestion. It is the schedule.",
  "Locals don't go where the cruise ships dock. That's the whole tip.",
  "A toast with rakija settles more arguments than a meeting ever could.",
  "If it's on every list, it's not a secret. It's just popular.",
  "The Balkans don't need to be discovered. They need to be visited properly.",
];

/** Deterministic pick so the same item always shows the same truth across renders. */
export function pickTruth(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return balkanishTruths[hash % balkanishTruths.length];
}
