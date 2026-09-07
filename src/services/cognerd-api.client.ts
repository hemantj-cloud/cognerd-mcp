import { Injectable } from '@nitrostack/core';
import axios, { AxiosInstance } from 'axios';
import { cognerdConfig, CognerdConfig } from '../config/cognerd.config.js';
import { OAuthService } from './oauth.service.js';

export interface McpRpcResponse<T = any> {
  jsonrpc: string;
  id: number | string;
  result?: {
    content?: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
    structuredContent?: T;
    isError?: boolean;
    [key: string]: any;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

@Injectable({ deps: [OAuthService] })
export class CognerdApiClient {
  private config: CognerdConfig;
  private httpClient: AxiosInstance;
  private sessionCookie: string | null = null;
  private sessionExpiresAt: number = 0;

  constructor(private readonly oauthService: OAuthService) {
    this.config = cognerdConfig;
    this.httpClient = axios.create({
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
    });
  }

  /**
   * Ensures an active Better-Auth session cookie for direct REST endpoints on api-dev.cognerd.in.
   */
  async ensureSession(): Promise<string | null> {
    if (this.config.isMockMode) {
      return null;
    }

    if (this.sessionCookie && Date.now() < this.sessionExpiresAt) {
      return this.sessionCookie;
    }

    if (!this.config.sandboxEmail || !this.config.sandboxPassword) {
      return null;
    }

    try {
      const response = await this.httpClient.post(
        `${this.config.restBaseUrl}/api/auth/sign-in/email`,
        {
          email: this.config.sandboxEmail,
          password: this.config.sandboxPassword,
          rememberMe: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 400,
        }
      );

      const setCookies = response.headers['set-cookie'];
      if (setCookies && Array.isArray(setCookies) && setCookies.length > 0) {
        this.sessionCookie = setCookies.map((c: string) => c.split(';')[0]).join('; ');
        this.sessionExpiresAt = Date.now() + 6 * 24 * 60 * 60 * 1000; // 6 days
        return this.sessionCookie;
      }
    } catch (err: any) {
      console.warn(`[CognerdApiClient] Session sign-in failed: ${err.message}`);
    }

    return null;
  }

  /**
   * Calls a REST API endpoint on the CogNerd backend with Better-Auth session cookie.
   */
  async callRest<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      data?: any;
      params?: Record<string, any>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T | null> {
    if (this.config.isMockMode) {
      return null;
    }

    try {
      const cookie = await this.ensureSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      };

      if (cookie) {
        headers['Cookie'] = cookie;
      }

      const response = await this.httpClient.request<T>({
        url: `${this.config.restBaseUrl}${endpoint}`,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        headers,
      });

      return response.data;
    } catch (error: any) {
      console.warn(`[CognerdApiClient] REST ${options.method || 'GET'} ${endpoint} failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Calls a live tool on the CogNerd MCP server using JSON-RPC 2.0.
   */
  async callTool<T = any>(toolName: string, args: Record<string, any> = {}): Promise<T | null> {
    if (this.config.isMockMode) {
      return null;
    }

    try {
      const token = await this.oauthService.ensureAccessToken();
      const payload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      };

      const response = await this.httpClient.post(this.config.mcpUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'text',
      });

      const parsed = this.parseMcpPayload<T>(response.data);
      if (!parsed) return null;

      if (parsed.error) {
        console.warn(`[CognerdApiClient] Tool ${toolName} returned error:`, parsed.error);
        return null;
      }

      if (parsed.result?.structuredContent) {
        return parsed.result.structuredContent as T;
      }

      if (parsed.result?.content?.[0]?.text) {
        try {
          return JSON.parse(parsed.result.content[0].text) as T;
        } catch {
          return parsed.result.content[0].text as unknown as T;
        }
      }

      return (parsed.result as unknown as T) || null;
    } catch (error: any) {
      console.warn(`[CognerdApiClient] Failed to execute live tool '${toolName}': ${error.message}`);
      return null;
    }
  }

  /**
   * Polls an async job until completion using get_job_status tool or REST polling.
   */
  async pollJobUntilComplete<T = any>(jobId: string, maxAttempts = 15, intervalMs = 2000): Promise<T | null> {
    if (this.config.isMockMode) {
      return null;
    }

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const jobStatus = await this.callTool('get_job_status', { job_id: jobId });
        if (jobStatus && (jobStatus.status === 'completed' || jobStatus.status === 'done')) {
          const artifact = await this.callTool('get_artifact', { job_id: jobId });
          return (artifact || jobStatus) as T;
        }
        if (jobStatus && jobStatus.status === 'failed') {
          console.warn(`[CognerdApiClient] Job ${jobId} reported failure:`, jobStatus.error);
          return null;
        }
      } catch (err: any) {
        console.warn(`[CognerdApiClient] Job status poll error: ${err.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return null;
  }

  /**
   * Parses either raw JSON or SSE text/event-stream from MCP responses.
   */
  private parseMcpPayload<T>(raw: any): McpRpcResponse<T> | null {
    if (typeof raw === 'object' && raw !== null) {
      return raw as McpRpcResponse<T>;
    }

    if (typeof raw !== 'string') {
      return null;
    }

    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed) as McpRpcResponse<T>;
      } catch {
        return null;
      }
    }

    // Parse SSE lines
    const lines = trimmed.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        try {
          return JSON.parse(jsonStr) as McpRpcResponse<T>;
        } catch {}
      }
    }

    return null;
  }
}

