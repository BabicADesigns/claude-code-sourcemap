/**
 * Beispiel: Meta Ads / Marketing API
 * Kampagnen-Performance, Ausgaben-Übersicht, ROI-Tracking
 */

import { createMetaSDK } from "../src/index.js";

const sdk = createMetaSDK({
  accessToken: process.env.META_ACCESS_TOKEN!,
  apiVersion: "v21.0",
});

const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID!;

async function main() {
  console.log("=== Meta Ads Performance — BabicA Designs ===\n");

  // Ausgaben-Zusammenfassung (letzte 30 Tage)
  const summary = await sdk.marketing.getSpendSummary(AD_ACCOUNT_ID, "last_30d");

  console.log("💸 Ausgaben (letzte 30 Tage):");
  console.log(`   Gesamt:        ${summary.totalSpend.toFixed(2)} ${summary.currency}`);
  console.log(`   Kampagnen:     ${summary.campaignCount}`);
  console.log();

  console.log("🏆 Top Kampagnen nach Ausgaben:");
  for (const c of summary.topCampaigns) {
    const ctr = parseFloat(c.ctr ?? "0").toFixed(2);
    const cpc = parseFloat(c.cpc ?? "0").toFixed(2);
    const spend = parseFloat(c.spend).toFixed(2);

    console.log(`   📣 ${c.campaign_name}`);
    console.log(`      Ausgaben:     ${spend} ${summary.currency}`);
    console.log(`      Reichweite:   ${parseInt(c.reach).toLocaleString()}`);
    console.log(`      Impressionen: ${parseInt(c.impressions).toLocaleString()}`);
    console.log(`      Klicks:       ${parseInt(c.clicks).toLocaleString()}`);
    console.log(`      CTR:          ${ctr}%`);
    console.log(`      CPC:          ${cpc} ${summary.currency}`);
    console.log();
  }

  // Alle aktiven Kampagnen
  const activeCampaigns = await sdk.marketing.getCampaigns(AD_ACCOUNT_ID, ["ACTIVE"]);
  console.log(`▶️  Aktive Kampagnen: ${activeCampaigns.data.length}`);
  for (const camp of activeCampaigns.data) {
    const budget = camp.daily_budget
      ? `${(parseInt(camp.daily_budget) / 100).toFixed(2)}/Tag`
      : camp.lifetime_budget
      ? `${(parseInt(camp.lifetime_budget) / 100).toFixed(2)} gesamt`
      : "—";

    console.log(`   • ${camp.name} (${camp.objective}) — Budget: ${budget}`);
  }
}

main().catch(console.error);
