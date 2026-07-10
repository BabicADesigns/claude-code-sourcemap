import { MetaClient } from "./client.js";
import type {
  AdAccount,
  AdCampaign,
  AdCampaignInsights,
  AdSet,
  Ad,
  AdObjectiveType,
  AdStatus,
  PaginatedResponse,
} from "./types.js";

const CAMPAIGN_FIELDS = "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,spend_cap";
const ADSET_FIELDS = "id,name,status,campaign_id,daily_budget,lifetime_budget,targeting";
const AD_FIELDS = "id,name,status,adset_id,campaign_id,creative";

export class MarketingAPI {
  constructor(private readonly client: MetaClient) {}

  // ─── Ad Accounts ─────────────────────────────────────────────────────────

  async getAdAccounts(): Promise<PaginatedResponse<AdAccount>> {
    return this.client.get<PaginatedResponse<AdAccount>>("/me/adaccounts", {
      fields: "id,name,account_status,currency,timezone_name,spend_cap,balance,amount_spent",
    });
  }

  async getAdAccount(adAccountId: string): Promise<AdAccount> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    return this.client.get<AdAccount>(`/${id}`, {
      fields: "id,name,account_status,currency,timezone_name,spend_cap,balance,amount_spent",
    });
  }

  // ─── Campaigns ───────────────────────────────────────────────────────────

  async getCampaigns(
    adAccountId: string,
    status?: AdStatus[]
  ): Promise<PaginatedResponse<AdCampaign>> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const params: Record<string, string> = { fields: CAMPAIGN_FIELDS };
    if (status) params.effective_status = JSON.stringify(status);

    return this.client.get<PaginatedResponse<AdCampaign>>(`/${id}/campaigns`, params);
  }

  async createCampaign(
    adAccountId: string,
    params: {
      name: string;
      objective: AdObjectiveType;
      status?: AdStatus;
      dailyBudget?: number; // in cents
      lifetimeBudget?: number; // in cents
      startTime?: string;
      stopTime?: string;
    }
  ): Promise<{ id: string }> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const body: Record<string, unknown> = {
      name: params.name,
      objective: params.objective,
      status: params.status ?? "PAUSED",
      special_ad_categories: [],
    };
    if (params.dailyBudget) body.daily_budget = params.dailyBudget;
    if (params.lifetimeBudget) body.lifetime_budget = params.lifetimeBudget;
    if (params.startTime) body.start_time = params.startTime;
    if (params.stopTime) body.stop_time = params.stopTime;

    return this.client.post<{ id: string }>(`/${id}/campaigns`, body);
  }

  async updateCampaignStatus(campaignId: string, status: AdStatus): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>(`/${campaignId}`, { status });
  }

  // ─── Campaign Insights ───────────────────────────────────────────────────

  async getCampaignInsights(
    adAccountId: string,
    datePreset:
      | "today"
      | "yesterday"
      | "this_week_sun_today"
      | "last_7d"
      | "last_14d"
      | "last_30d"
      | "last_month"
      | "this_month"
      | "last_90d" = "last_30d",
    level: "account" | "campaign" | "adset" | "ad" = "campaign"
  ): Promise<PaginatedResponse<AdCampaignInsights>> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    return this.client.get<PaginatedResponse<AdCampaignInsights>>(`/${id}/insights`, {
      fields: "campaign_id,campaign_name,impressions,reach,clicks,spend,cpc,cpm,ctr,cpp,frequency",
      date_preset: datePreset,
      level,
    });
  }

  async getCampaignInsightsByDateRange(
    adAccountId: string,
    since: string,
    until: string,
    level: "account" | "campaign" | "adset" | "ad" = "campaign"
  ): Promise<PaginatedResponse<AdCampaignInsights>> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    return this.client.get<PaginatedResponse<AdCampaignInsights>>(`/${id}/insights`, {
      fields: "campaign_id,campaign_name,impressions,reach,clicks,spend,cpc,cpm,ctr,cpp,frequency",
      time_range: JSON.stringify({ since, until }),
      level,
    });
  }

  // ─── Ad Sets ─────────────────────────────────────────────────────────────

  async getAdSets(
    adAccountId: string,
    campaignId?: string
  ): Promise<PaginatedResponse<AdSet>> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const params: Record<string, string> = { fields: ADSET_FIELDS };
    if (campaignId) params.campaign_id = campaignId;

    return this.client.get<PaginatedResponse<AdSet>>(`/${id}/adsets`, params);
  }

  // ─── Ads ─────────────────────────────────────────────────────────────────

  async getAds(adAccountId: string, status?: AdStatus[]): Promise<PaginatedResponse<Ad>> {
    const id = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const params: Record<string, string> = { fields: AD_FIELDS };
    if (status) params.effective_status = JSON.stringify(status);

    return this.client.get<PaginatedResponse<Ad>>(`/${id}/ads`, params);
  }

  // ─── Spend Summary ───────────────────────────────────────────────────────

  async getSpendSummary(
    adAccountId: string,
    datePreset = "last_30d" as const
  ): Promise<{
    totalSpend: number;
    currency: string;
    campaignCount: number;
    topCampaigns: AdCampaignInsights[];
  }> {
    const [account, insights] = await Promise.all([
      this.getAdAccount(adAccountId),
      this.getCampaignInsights(adAccountId, datePreset, "campaign"),
    ]);

    const sorted = [...insights.data].sort(
      (a, b) => parseFloat(b.spend) - parseFloat(a.spend)
    );

    return {
      totalSpend: sorted.reduce((sum, c) => sum + parseFloat(c.spend), 0),
      currency: account.currency,
      campaignCount: sorted.length,
      topCampaigns: sorted.slice(0, 5),
    };
  }
}
