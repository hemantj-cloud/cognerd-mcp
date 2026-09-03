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

  constructor(private readonly oauthService: OAuthService) {
    this.config = cognerdConfig;
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
    });
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
