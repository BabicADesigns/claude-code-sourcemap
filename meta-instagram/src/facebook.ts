import { MetaClient } from "./client.js";
import type { FbPage, PaginatedResponse } from "./types.js";

export class FacebookAPI {
  constructor(private readonly client: MetaClient) {}

  // ─── Pages ───────────────────────────────────────────────────────────────

  async getMyPages(): Promise<PaginatedResponse<FbPage>> {
    return this.client.get<PaginatedResponse<FbPage>>("/me/accounts", {
      fields: "id,name,category,fan_count,followers_count,website,about,picture,instagram_business_account",
    });
  }

  async getPage(pageId: string): Promise<FbPage> {
    return this.client.get<FbPage>(`/${pageId}`, {
      fields: "id,name,category,fan_count,followers_count,website,about,picture,instagram_business_account",
    });
  }

  // Returns the Instagram Business Account ID linked to a Facebook Page
  async getLinkedInstagramAccountId(pageId: string): Promise<string | null> {
    const page = await this.getPage(pageId);
    return page.instagram_business_account?.id ?? null;
  }

  // ─── Page Insights ───────────────────────────────────────────────────────

  async getPageInsights(
    pageId: string,
    metrics: string[],
    period: "day" | "week" | "days_28" | "month" = "day",
    since?: string,
    until?: string
  ): Promise<{ data: Array<{ name: string; period: string; values: Array<{ value: number | Record<string, number>; end_time: string }> }> }> {
    const params: Record<string, string> = {
      metric: metrics.join(","),
      period,
    };
    if (since) params.since = since;
    if (until) params.until = until;

    return this.client.get(`/${pageId}/insights`, params);
  }

  // ─── User Token Info ─────────────────────────────────────────────────────

  async getTokenInfo(): Promise<{ id: string; name: string; email?: string }> {
    return this.client.get<{ id: string; name: string; email?: string }>("/me", {
      fields: "id,name,email",
    });
  }

  async debugToken(inputToken: string, appId: string, appSecret: string): Promise<{
    data: {
      app_id: string;
      type: string;
      application: string;
      expires_at: number;
      is_valid: boolean;
      scopes: string[];
      user_id: string;
    };
  }> {
    return this.client.get("/debug_token", {
      input_token: inputToken,
      access_token: `${appId}|${appSecret}`,
    });
  }
}
