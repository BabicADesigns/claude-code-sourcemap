import { MetaClient } from "./client.js";
import type {
  IgAccount,
  IgMedia,
  IgMediaInsights,
  AccountInsight,
  AccountInsightMetric,
  AudienceDemographic,
  IgComment,
  IgHashtag,
  IgHashtagMedia,
  IgStory,
  IgMentionedMedia,
  InsightPeriod,
  PaginatedResponse,
  CreateImageContainerParams,
  CreateVideoContainerParams,
  CreateReelContainerParams,
  CreateCarouselContainerParams,
  MediaContainer,
  PublishResult,
} from "./types.js";

const ACCOUNT_FIELDS =
  "id,name,username,biography,website,profile_picture_url,followers_count,follows_count,media_count,account_type,ig_id";

const MEDIA_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,shortcode,timestamp,username,like_count,comments_count,is_comment_enabled";

const MEDIA_INSIGHT_METRICS =
  "impressions,reach,engagement,saved,video_views,plays,shares,likes,comments";

export class InstagramAPI {
  constructor(private readonly client: MetaClient) {}

  // ─── Account ─────────────────────────────────────────────────────────────

  async getAccount(igUserId: string): Promise<IgAccount> {
    return this.client.get<IgAccount>(`/${igUserId}`, { fields: ACCOUNT_FIELDS });
  }

  // ─── Media ───────────────────────────────────────────────────────────────

  async getMedia(igUserId: string, limit = 25): Promise<PaginatedResponse<IgMedia>> {
    return this.client.get<PaginatedResponse<IgMedia>>(`/${igUserId}/media`, {
      fields: MEDIA_FIELDS,
      limit,
    });
  }

  async getMediaItem(mediaId: string): Promise<IgMedia> {
    return this.client.get<IgMedia>(`/${mediaId}`, { fields: MEDIA_FIELDS });
  }

  async getStories(igUserId: string): Promise<PaginatedResponse<IgStory>> {
    return this.client.get<PaginatedResponse<IgStory>>(`/${igUserId}/stories`, {
      fields: MEDIA_FIELDS,
    });
  }

  // ─── Insights / Analytics ────────────────────────────────────────────────

  async getAccountInsights(
    igUserId: string,
    metrics: AccountInsightMetric[],
    period: InsightPeriod = "day",
    since?: string,
    until?: string
  ): Promise<PaginatedResponse<AccountInsight>> {
    const params: Record<string, string | number> = {
      metric: metrics.join(","),
      period,
    };
    if (since) params.since = since;
    if (until) params.until = until;

    return this.client.get<PaginatedResponse<AccountInsight>>(`/${igUserId}/insights`, params);
  }

  async getFollowerDemographics(
    igUserId: string
  ): Promise<PaginatedResponse<AudienceDemographic>> {
    return this.client.get<PaginatedResponse<AudienceDemographic>>(`/${igUserId}/insights`, {
      metric: "audience_city,audience_country,audience_gender_age",
      period: "lifetime",
    });
  }

  async getMediaInsights(mediaId: string, mediaType: IgMedia["media_type"] = "IMAGE"): Promise<IgMediaInsights> {
    let metrics = MEDIA_INSIGHT_METRICS;

    if (mediaType === "STORY") {
      metrics = "impressions,reach,exits,replies,taps_forward,taps_back";
    } else if (mediaType === "VIDEO" || mediaType === "REEL") {
      metrics = "impressions,reach,engagement,saved,video_views,plays,shares,likes,comments";
    }

    const resp = await this.client.get<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
      `/${mediaId}/insights`,
      { metric: metrics }
    );

    const insights: IgMediaInsights = { id: mediaId };
    for (const item of resp.data) {
      (insights as Record<string, unknown>)[item.name] = item.values[0]?.value ?? 0;
    }
    return insights;
  }

  // ─── Bulk Media with Insights ────────────────────────────────────────────

  async getMediaWithInsights(
    igUserId: string,
    limit = 10
  ): Promise<Array<IgMedia & { insights: IgMediaInsights }>> {
    const { data: posts } = await this.getMedia(igUserId, limit);

    const results = await Promise.all(
      posts.map(async (post) => {
        try {
          const insights = await this.getMediaInsights(post.id, post.media_type);
          return { ...post, insights };
        } catch {
          return { ...post, insights: { id: post.id } };
        }
      })
    );

    return results;
  }

  // ─── Comments ────────────────────────────────────────────────────────────

  async getComments(mediaId: string, limit = 50): Promise<PaginatedResponse<IgComment>> {
    return this.client.get<PaginatedResponse<IgComment>>(`/${mediaId}/comments`, {
      fields: "id,text,timestamp,username,like_count,hidden,replies{id,text,timestamp,username}",
      limit,
    });
  }

  async replyToComment(mediaId: string, message: string): Promise<{ id: string }> {
    return this.client.post<{ id: string }>(`/${mediaId}/replies`, { message });
  }

  async hideComment(commentId: string, hide: boolean): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>(`/${commentId}`, { hide });
  }

  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/${commentId}`);
  }

  // ─── Hashtag Research ────────────────────────────────────────────────────

  async searchHashtag(igUserId: string, hashtag: string): Promise<IgHashtag> {
    const resp = await this.client.get<PaginatedResponse<IgHashtag>>(`/ig_hashtag_search`, {
      user_id: igUserId,
      q: hashtag.replace(/^#/, ""),
    });
    if (!resp.data[0]) throw new Error(`Hashtag #${hashtag} not found`);
    return resp.data[0];
  }

  async getHashtagTopMedia(igUserId: string, hashtagId: string, limit = 10): Promise<PaginatedResponse<IgHashtagMedia>> {
    return this.client.get<PaginatedResponse<IgHashtagMedia>>(`/${hashtagId}/top_media`, {
      user_id: igUserId,
      fields: MEDIA_FIELDS,
      limit,
    });
  }

  async getHashtagRecentMedia(igUserId: string, hashtagId: string, limit = 10): Promise<PaginatedResponse<IgHashtagMedia>> {
    return this.client.get<PaginatedResponse<IgHashtagMedia>>(`/${hashtagId}/recent_media`, {
      user_id: igUserId,
      fields: MEDIA_FIELDS,
      limit,
    });
  }

  async researchHashtag(
    igUserId: string,
    hashtag: string
  ): Promise<{ hashtag: IgHashtag; topMedia: IgHashtagMedia[]; recentMedia: IgHashtagMedia[] }> {
    const tag = await this.searchHashtag(igUserId, hashtag);
    const [top, recent] = await Promise.all([
      this.getHashtagTopMedia(igUserId, tag.id, 5),
      this.getHashtagRecentMedia(igUserId, tag.id, 5),
    ]);

    return { hashtag: tag, topMedia: top.data, recentMedia: recent.data };
  }

  // ─── Mentions ────────────────────────────────────────────────────────────

  async getMentionedMedia(igUserId: string, mediaId: string): Promise<IgMentionedMedia> {
    return this.client.get<IgMentionedMedia>(`/${igUserId}`, {
      fields: "mentioned_media.fields(media_url,media_type,timestamp,caption)",
      media_id: mediaId,
    });
  }

  async getTaggedMedia(igUserId: string, limit = 25): Promise<PaginatedResponse<IgMedia>> {
    return this.client.get<PaginatedResponse<IgMedia>>(`/${igUserId}/tags`, {
      fields: MEDIA_FIELDS,
      limit,
    });
  }

  // ─── Content Publishing ──────────────────────────────────────────────────

  async createImageContainer(
    igUserId: string,
    params: CreateImageContainerParams
  ): Promise<MediaContainer> {
    const body: Record<string, unknown> = { image_url: params.imageUrl };
    if (params.caption) body.caption = params.caption;
    if (params.locationId) body.location_id = params.locationId;
    if (params.altText) body.alt_text = params.altText;
    if (params.userTags) body.user_tags = params.userTags.map((t) => ({ username: t.username, x: t.x, y: t.y }));

    return this.client.post<MediaContainer>(`/${igUserId}/media`, body);
  }

  async createVideoContainer(
    igUserId: string,
    params: CreateVideoContainerParams
  ): Promise<MediaContainer> {
    const body: Record<string, unknown> = { video_url: params.videoUrl, media_type: "VIDEO" };
    if (params.caption) body.caption = params.caption;
    if (params.thumbOffset) body.thumb_offset = params.thumbOffset;
    if (params.locationId) body.location_id = params.locationId;
    if (params.altText) body.alt_text = params.altText;

    return this.client.post<MediaContainer>(`/${igUserId}/media`, body);
  }

  async createReelContainer(
    igUserId: string,
    params: CreateReelContainerParams
  ): Promise<MediaContainer> {
    const body: Record<string, unknown> = { video_url: params.videoUrl, media_type: "REELS" };
    if (params.caption) body.caption = params.caption;
    if (params.coverUrl) body.cover_url = params.coverUrl;
    if (params.shareToFeed !== undefined) body.share_to_feed = params.shareToFeed;
    if (params.locationId) body.location_id = params.locationId;

    return this.client.post<MediaContainer>(`/${igUserId}/media`, body);
  }

  async createCarouselContainer(
    igUserId: string,
    params: CreateCarouselContainerParams
  ): Promise<MediaContainer> {
    const body: Record<string, unknown> = {
      media_type: "CAROUSEL",
      children: params.children.join(","),
    };
    if (params.caption) body.caption = params.caption;
    if (params.locationId) body.location_id = params.locationId;

    return this.client.post<MediaContainer>(`/${igUserId}/media`, body);
  }

  async getContainerStatus(containerId: string): Promise<{ id: string; status_code: string; status?: string }> {
    return this.client.get<{ id: string; status_code: string; status?: string }>(`/${containerId}`, {
      fields: "id,status_code,status",
    });
  }

  async waitForContainer(
    containerId: string,
    maxWaitMs = 120_000,
    pollIntervalMs = 3_000
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const { status_code } = await this.getContainerStatus(containerId);
      if (status_code === "FINISHED") return;
      if (status_code === "ERROR" || status_code === "EXPIRED") {
        throw new Error(`Container ${containerId} failed with status: ${status_code}`);
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    throw new Error(`Container ${containerId} timed out`);
  }

  async publishMedia(igUserId: string, creationId: string): Promise<PublishResult> {
    return this.client.post<PublishResult>(`/${igUserId}/media_publish`, {
      creation_id: creationId,
    });
  }

  // ─── Convenience: publish image in one call ───────────────────────────────

  async publishImage(igUserId: string, params: CreateImageContainerParams): Promise<PublishResult> {
    const container = await this.createImageContainer(igUserId, params);
    await this.waitForContainer(container.id);
    return this.publishMedia(igUserId, container.id);
  }

  async publishReel(igUserId: string, params: CreateReelContainerParams): Promise<PublishResult> {
    const container = await this.createReelContainer(igUserId, params);
    await this.waitForContainer(container.id);
    return this.publishMedia(igUserId, container.id);
  }

  // ─── Summary Dashboard ───────────────────────────────────────────────────

  async getBusinessDashboard(
    igUserId: string,
    period: InsightPeriod = "day"
  ): Promise<{
    account: IgAccount;
    insights: {
      impressions: number;
      reach: number;
      profileViews: number;
      followerCount: number;
      websiteClicks: number;
    };
    topPosts: Array<IgMedia & { insights: IgMediaInsights }>;
  }> {
    const [account, insightsResp, topPosts] = await Promise.all([
      this.getAccount(igUserId),
      this.getAccountInsights(
        igUserId,
        ["impressions", "reach", "profile_views", "follower_count", "website_clicks"],
        period
      ),
      this.getMediaWithInsights(igUserId, 5),
    ]);

    const getValue = (name: string) =>
      insightsResp.data.find((i) => i.name === name)?.values.at(-1)?.value ?? 0;

    return {
      account,
      insights: {
        impressions: getValue("impressions"),
        reach: getValue("reach"),
        profileViews: getValue("profile_views"),
        followerCount: getValue("follower_count"),
        websiteClicks: getValue("website_clicks"),
      },
      topPosts: topPosts.sort(
        (a, b) => (b.insights.reach ?? 0) - (a.insights.reach ?? 0)
      ),
    };
  }
}
