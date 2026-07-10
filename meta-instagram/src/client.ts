import type { MetaConfig, MetaError } from "./types.js";

export class MetaApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly type: string,
    message: string,
    public readonly fbtrace_id?: string
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

export class MetaClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(config: MetaConfig) {
    const version = config.apiVersion ?? "v21.0";
    this.baseUrl = `https://graph.facebook.com/${version}`;
    this.accessToken = config.accessToken;
  }

  async get<T>(path: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("access_token", this.accessToken);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const resp = await fetch(url.toString());
    return this.handleResponse<T>(resp);
  }

  async post<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("access_token", this.accessToken);

    const resp = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(resp);
  }

  async delete<T>(path: string): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("access_token", this.accessToken);

    const resp = await fetch(url.toString(), { method: "DELETE" });
    return this.handleResponse<T>(resp);
  }

  private async handleResponse<T>(resp: Response): Promise<T> {
    const json = await resp.json() as T | { error: MetaError };

    if (!resp.ok || (json as { error?: MetaError }).error) {
      const err = (json as { error: MetaError }).error;
      throw new MetaApiError(err.code, err.type, err.message, err.fbtrace_id);
    }

    return json as T;
  }
}
