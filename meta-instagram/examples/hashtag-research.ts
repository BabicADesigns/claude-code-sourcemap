/**
 * Beispiel: Hashtag-Recherche
 * Analysiert Hashtags für dein Business und zeigt Top-Posts
 */

import { createMetaSDK } from "../src/index.js";

const sdk = createMetaSDK({
  accessToken: process.env.META_ACCESS_TOKEN!,
  apiVersion: "v21.0",
});

const IG_USER_ID = process.env.IG_USER_ID!;

// Deine Business-relevanten Hashtags
const HASHTAGS_TO_RESEARCH = [
  "babicadesigns",
  "printdesign",
  "logodesign",
  "webdesign",
  "branding",
  "graphicdesign",
  "smallbusiness",
];

async function main() {
  console.log("=== Hashtag-Recherche für BabicA Designs ===\n");

  for (const tag of HASHTAGS_TO_RESEARCH) {
    console.log(`🔍 Analysiere #${tag}...`);

    try {
      const research = await sdk.instagram.researchHashtag(IG_USER_ID, tag);

      console.log(`   Hashtag-ID: ${research.hashtag.id}`);
      console.log(`   Top-Posts: ${research.topMedia.length} gefunden`);

      // Zeige die meistgelikten Top-Posts
      const sorted = research.topMedia
        .filter((p) => p.like_count)
        .sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));

      if (sorted[0]) {
        console.log(`   Best Post: ${sorted[0].like_count} Likes — ${sorted[0].permalink}`);
      }

      console.log(`   Neueste Posts: ${research.recentMedia.length} angezeigt`);
      console.log();

      // Rate limit: max 30 unique hashtags per 7 days
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`   ⚠️  Fehler: ${msg}\n`);
    }
  }
}

main().catch(console.error);
