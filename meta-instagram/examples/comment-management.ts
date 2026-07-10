/**
 * Beispiel: Kommentar-Management
 * Kommentare lesen, antworten, moderieren
 */

import { createMetaSDK } from "../src/index.js";

const sdk = createMetaSDK({
  accessToken: process.env.META_ACCESS_TOKEN!,
  apiVersion: "v21.0",
});

const IG_USER_ID = process.env.IG_USER_ID!;

// Einfache Spam-Wörter filtern
const SPAM_KEYWORDS = ["follow4follow", "f4f", "dm me", "check my profile", "giveaway"];

function isSpam(text: string): boolean {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some((kw) => lower.includes(kw));
}

async function main() {
  console.log("=== Kommentar-Management — BabicA Designs ===\n");

  // Neueste Posts laden
  const { data: posts } = await sdk.instagram.getMedia(IG_USER_ID, 5);

  for (const post of posts) {
    if (!post.comments_count || post.comments_count === 0) continue;

    console.log(`📸 Post vom ${new Date(post.timestamp).toLocaleDateString("de-AT")}`);
    console.log(`   ${(post.caption ?? "").slice(0, 80)}…`);
    console.log(`   ${post.comments_count} Kommentare\n`);

    const { data: comments } = await sdk.instagram.getComments(post.id, 20);

    for (const comment of comments) {
      const spam = isSpam(comment.text);
      const prefix = spam ? "🚫" : "💬";

      console.log(`   ${prefix} @${comment.username ?? "?"}: ${comment.text.slice(0, 80)}`);
      console.log(`      ${new Date(comment.timestamp).toLocaleString("de-AT")} | Likes: ${comment.like_count ?? 0}`);

      if (comment.replies?.data?.length) {
        for (const reply of comment.replies.data) {
          console.log(`      ↳ @${reply.username ?? "?"}: ${reply.text.slice(0, 60)}`);
        }
      }

      // Spam automatisch verstecken
      if (spam) {
        await sdk.instagram.hideComment(comment.id, true);
        console.log(`      ⚠️  Als Spam versteckt`);
      }

      console.log();
    }

    // Unantwortete Kommentare (ohne Replies) zählen
    const unanswered = comments.filter((c) => !c.replies?.data?.length);
    if (unanswered.length > 0) {
      console.log(`   ℹ️  ${unanswered.length} Kommentare ohne Antwort\n`);
    }
  }

  // Erwähnungen abrufen
  const { data: tagged } = await sdk.instagram.getTaggedMedia(IG_USER_ID, 10);
  if (tagged.length > 0) {
    console.log(`\n🏷️  Du wurdest in ${tagged.length} Posts markiert:`);
    for (const media of tagged) {
      console.log(`   @${media.username ?? "?"} — ${media.permalink}`);
    }
  }
}

main().catch(console.error);
