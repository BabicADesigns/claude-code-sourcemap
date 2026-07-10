// Meta / Instagram Graph API — Type Definitions

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface MetaConfig {
  accessToken: string;
  appId?: string;
  appSecret?: string;
  apiVersion?: string; // e.g. "v21.0"
}

// ─── Generic ─────────────────────────────────────────────────────────────────

export interface PaginationCursor {
  before: string;
  after: string;
}

export interface Paging {
  cursors?: PaginationCursor;
  next?: string;
  previous?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  paging?: Paging;
}

export interface MetaError {
  message: string;
  type: string;
  code: number;
  fbtrace_id?: string;
}

export interface MetaErrorResponse {
  error: MetaError;
}

// ─── Instagram Account ───────────────────────────────────────────────────────

export type AccountType = "BUSINESS" | "MEDIA_CREATOR" | "PERSONAL";

export interface IgAccount {
  id: string;
  name: string;
  username: string;
  biography?: string;
  website?: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  account_type: AccountType;
  ig_id?: number;
}

// ─── Media / Posts ───────────────────────────────────────────────────────────

export type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REEL" | "STORY";
export type MediaStatus = "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED";

export interface IgMedia {
  id: string;
  caption?: string;
  media_type: MediaType;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  shortcode?: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
  is_comment_enabled?: boolean;
  ig_id?: string;
}

export interface IgMediaInsights {
  id: string;
  impressions?: number;
  reach?: number;
  engagement?: number;
  saved?: number;
  video_views?: number;
  plays?: number;
  shares?: number;
  likes?: number;
  comments?: number;
  exits?: number;
  replies?: number;
  taps_forward?: number;
  taps_back?: number;
}

// ─── Account Insights ────────────────────────────────────────────────────────

export type InsightPeriod = "day" | "week" | "days_28" | "month" | "lifetime";

export type AccountInsightMetric =
  | "follower_count"
  | "impressions"
  | "reach"
  | "profile_views"
  | "website_clicks"
  | "email_contacts"
  | "get_directions_clicks"
  | "phone_call_clicks"
  | "text_message_clicks";

export interface InsightValue {
  value: number;
  end_time?: string;
}

export interface AccountInsight {
  name: AccountInsightMetric;
  period: InsightPeriod;
  values: InsightValue[];
  title: string;
  description: string;
  id: string;
}

export interface AudienceDemographic {
  name: string;
  period: string;
  values: Array<{ value: Record<string, number>; end_time: string }>;
  id: string;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface IgComment {
  id: string;
  text: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  hidden?: boolean;
  replies?: PaginatedResponse<IgComment>;
}

// ─── Hashtags ────────────────────────────────────────────────────────────────

export interface IgHashtag {
  id: string;
  name?: string;
}

export interface IgHashtagMedia extends IgMedia {
  children?: PaginatedResponse<{ id: string; media_url?: string }>;
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export interface IgStory extends IgMedia {
  media_type: "STORY";
}

// ─── Content Publishing ──────────────────────────────────────────────────────

export interface CreateImageContainerParams {
  imageUrl: string;
  caption?: string;
  locationId?: string;
  userTags?: Array<{ username: string; x: number; y: number }>;
  altText?: string;
}

export interface CreateVideoContainerParams {
  videoUrl: string;
  caption?: string;
  thumbOffset?: number;
  locationId?: string;
  altText?: string;
}

export interface CreateReelContainerParams {
  videoUrl: string;
  caption?: string;
  coverUrl?: string;
  shareToFeed?: boolean;
  locationId?: string;
}

export interface CreateCarouselContainerParams {
  children: string[]; // media container IDs
  caption?: string;
  locationId?: string;
}

export interface MediaContainer {
  id: string;
  status?: MediaStatus;
}

export interface PublishResult {
  id: string; // published media ID
}

// ─── Mentions ────────────────────────────────────────────────────────────────

export interface IgMentionedMedia {
  id: string;
  media_url?: string;
  media_type?: MediaType;
  timestamp?: string;
  caption?: string;
}

// ─── Facebook Page ───────────────────────────────────────────────────────────

export interface FbPage {
  id: string;
  name: string;
  category?: string;
  fan_count?: number;
  followers_count?: number;
  website?: string;
  about?: string;
  picture?: { data: { url: string } };
  instagram_business_account?: { id: string };
}

// ─── Meta Marketing / Ads API ────────────────────────────────────────────────

export type AdObjectiveType =
  | "BRAND_AWARENESS"
  | "REACH"
  | "TRAFFIC"
  | "ENGAGEMENT"
  | "APP_INSTALLS"
  | "VIDEO_VIEWS"
  | "LEAD_GENERATION"
  | "CONVERSIONS"
  | "CATALOG_SALES"
  | "STORE_TRAFFIC"
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES"
  | "OUTCOME_APP_PROMOTION";

export type AdStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  spend_cap?: string;
  balance?: string;
  amount_spent?: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  status: AdStatus;
  objective: AdObjectiveType;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  spend_cap?: string;
}

export interface AdCampaignInsights {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  cpp?: string;
  frequency?: string;
  date_start: string;
  date_stop: string;
}

export interface AdSet {
  id: string;
  name: string;
  status: AdStatus;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: Record<string, unknown>;
}

export interface Ad {
  id: string;
  name: string;
  status: AdStatus;
  adset_id: string;
  campaign_id: string;
  creative?: { id: string };
}
