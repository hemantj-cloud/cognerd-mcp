import { Injectable, DIContainer, NitroStackServer } from '@nitrostack/core';
import { cognerdConfig } from '../config/cognerd.config.js';

interface CachedIntrospection {
  result: {
    active: boolean;
    sub?: string;
    scope?: string;
    client_id?: string;
    aud?: string;
  };
  expiresAt: number;
}

const introspectionCache = new Map<string, CachedIntrospection>();

/**
 * RFC 7662 Token Introspection Service for CogNerd MCP
 *
 * Exposes a /oauth/introspect endpoint to validate opaque CogNerd Bearer tokens
 * (`cgnrd_...`) against the live upstream CogNerd MCP server (https://mcp.cognerd.in/mcp).
 * Integrates natively with NitroStack's HTTP auth middleware pipeline.
 */
@Injectable()
export class OAuthIntrospectionService {
  async onApplicationBootstrap() {
    try {
      const server = DIContainer.getInstance().resolve<NitroStackServer>('NitroStackServer');
      const httpTransport = (server as any)?.getHttpTransport?.();
      if (httpTransport && typeof httpTransport.on === 'function') {
        httpTransport.on('/oauth/introspect', this.handleIntrospection.bind(this));
      }
    } catch {
      // In non-HTTP transports or isolated testing, continue gracefully
    }
  }

  /**
   * Handles incoming RFC 7662 token introspection requests.
   */
  async handleIntrospection(req: any, res: any): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(200, headers);
      res.end('');
      return;
    }

    try {
      let token = req.body?.token;

      if (!token) {
        // Parse urlencoded or raw stream if not parsed by Express
        const buffers: Buffer[] = [];
        for await (const chunk of req) {
          buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(buffers).toString();
        if (rawBody) {
          const params = new URLSearchParams(rawBody);
          token = params.get('token');
        }
      }

      if (!token || typeof token !== 'string') {
        res.writeHead(200, headers);
        res.end(JSON.stringify({ active: false }));
        return;
      }

      // Check cache (5-minute TTL)
      const cached = introspectionCache.get(token);
      if (cached && Date.now() < cached.expiresAt) {
        res.writeHead(200, headers);
        res.end(JSON.stringify(cached.result));
        return;
      }

      // Validate live against upstream CogNerd MCP
      const liveValidation = await this.validateUpstreamToken(token);

      introspectionCache.set(token, {
        result: liveValidation,
        expiresAt: Date.now() + 300000,
      });

      res.writeHead(200, headers);
      res.end(JSON.stringify(liveValidation));
    } catch {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ active: false }));
    }
  }

  /**
   * Validates a Bearer token by executing `whoami` against the live CogNerd upstream gateway.
   */
  private async validateUpstreamToken(token: string): Promise<{
    active: boolean;
    sub?: string;
    scope?: string;
    client_id?: string;
    aud?: string;
  }> {
    try {
      const response = await fetch(`${cognerdConfig.apiBaseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'whoami', arguments: {} },
        }),
      });

      if (response.status !== 200) {
        return { active: false };
      }

      const text = await response.text();
      // Check if upstream returned an authentication failure inside response
      if (text.includes('"error":"invalid_token"') || text.includes('"error": "invalid_token"')) {
        return { active: false };
      }

      let sub = 'cognerd_authenticated_user';
      const idMatch = text.match(/['"]id['"]:\s*['"]?([^'",\s}]+)['"]?/);
      if (idMatch && idMatch[1]) {
        sub = `usr_${idMatch[1]}`;
      }

      const targetAud = cognerdConfig.tokenAudience || cognerdConfig.resourceUri;

      return {
        active: true,
        sub,
        scope: 'cognerd',
        client_id: 'cognerd_client',
        aud: targetAud,
      };
    } catch {
      return { active: false };
    }
  }
}
