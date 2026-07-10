import { MetaClient } from "./client.js";
import { InstagramAPI } from "./instagram.js";
import { FacebookAPI } from "./facebook.js";
import { MarketingAPI } from "./marketing.js";
import type { MetaConfig } from "./types.js";

export { MetaClient, MetaApiError } from "./client.js";
export { InstagramAPI } from "./instagram.js";
export { FacebookAPI } from "./facebook.js";
export { MarketingAPI } from "./marketing.js";
export * from "./types.js";

export class MetaBusinessSDK {
  public readonly instagram: InstagramAPI;
  public readonly facebook: FacebookAPI;
  public readonly marketing: MarketingAPI;

  constructor(config: MetaConfig) {
    const client = new MetaClient(config);
    this.instagram = new InstagramAPI(client);
    this.facebook = new FacebookAPI(client);
    this.marketing = new MarketingAPI(client);
  }
}

export function createMetaSDK(config: MetaConfig): MetaBusinessSDK {
  return new MetaBusinessSDK(config);
}
