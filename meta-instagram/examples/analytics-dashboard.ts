/**
 * Beispiel: Business Analytics Dashboard
 * Zeigt Reichweite, Impressionen, Top-Posts & Follower-Wachstum
 */

import { createMetaSDK } from "../src/index.js";

const sdk = createMetaSDK({
  accessToken: process.env.META_ACCESS_TOKEN!,
  apiVersion: "v21.0",
});

const IG_USER_ID = process.env.IG_USER_ID!;

async function main() {
  console.log("=== BabicA Designs — Instagram Business Dashboard ===\n");

  const dashboard = await sdk.instagram.getBusinessDashboard(IG_USER_ID, "day");

  // Account-Übersicht
  const { account, insights, topPosts } = dashboard;
  console.log(`📱 Account: @${account.username} (${account.name})`);
  console.log(`👥 Follower: ${account.followers_count.toLocaleString()}`);
  console.log(`📸 Posts gesamt: ${account.media_count}`);
  console.log(`🔗 Website: ${account.website ?? "—"}\n`);

  // Insights heute
  console.log("📊 Insights (heute):");
  console.log(`   Impressionen:   ${insights.impressions.toLocaleString()}`);
  console.log(`   Reichweite:     ${insights.reach.toLocaleString()}`);
  console.log(`   Profilaufrufe:  ${insights.profileViews.toLocaleString()}`);
  console.log(`   Website-Klicks: ${insights.websiteClicks.toLocaleString()}\n`);

  // Top 5 Posts nach Reichweite
  console.log("🏆 Top Posts (nach Reichweite):");
  for (const post of topPosts) {
    console.log(`   [${post.media_type}] ${new Date(post.timestamp).toLocaleDateString("de-AT")}`);
    console.log(`   Caption: ${(post.caption ?? "").slice(0, 60)}…`);
    console.log(`   Reichweite: ${(post.insights.reach ?? 0).toLocaleString()} | Impressionen: ${(post.insights.impressions ?? 0).toLocaleString()} | Gespeichert: ${post.insights.saved ?? 0}`);
    console.log(`   Link: ${post.permalink}\n`);
  }

  // 28-Tage Trend
  console.log("📈 28-Tage Trend:");
  const trend = await sdk.instagram.getAccountInsights(
    IG_USER_ID,
    ["follower_count", "impressions", "reach", "profile_views"],
    "days_28"
  );

  for (const metric of trend.data) {
    const latest = metric.values.at(-1)?.value ?? 0;
    console.log(`   ${metric.title}: ${latest.toLocaleString()}`);
  }
}

main().catch(console.error);
