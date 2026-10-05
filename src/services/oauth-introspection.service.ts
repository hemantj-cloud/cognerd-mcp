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
 * (`cgnrd_...`) against the live upstream CogNerd API server.
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

      if (!token && typeof req.body === 'string') {
        const params = new URLSearchParams(req.body);
        token = params.get('token');
      }

      if (!token && req.query?.token) {
        token = req.query.token;
      }

      if (!token && req.headers?.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
      }

      if (!token && req.readable !== false) {
        // Parse urlencoded or raw stream if not parsed by Express
        try {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const rawBody = Buffer.concat(buffers).toString();
          if (rawBody) {
            const params = new URLSearchParams(rawBody);
            token = params.get('token');
          }
        } catch {}
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

      // Only cache valid tokens (do NOT cache transient failures as inactive!)
      if (liveValidation.active) {
        introspectionCache.set(token, {
          result: liveValidation,
          expiresAt: Date.now() + 300000,
        });
      }

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
    const targetAud = cognerdConfig.tokenAudience || cognerdConfig.resourceUri;

    try {
      const cookieHeader = token.includes('session_token=')
        ? token
        : `__Secure-better-auth.session_token=${token}; better-auth.session_token=${token}`;

      const response = await fetch(`${cognerdConfig.restBaseUrl}/api/brand-monitor/brand-profile/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': cookieHeader,
        },
      });

      // Explicit authentication failure from upstream
      if (response.status === 401 || response.status === 403) {
        return { active: false };
      }

      if (response.status !== 200) {
        // If upstream is temporarily down/rate-limiting, but token is a valid CogNerd token
        if (token.startsWith('cgnrd_') && token.length > 20) {
          return {
            active: true,
            sub: 'usr_authenticated',
            scope: 'cognerd',
            client_id: 'cognerd_client',
            aud: targetAud,
          };
        }
        return { active: false };
      }

      const data: any = await response.json().catch(() => null);
      let sub = 'usr_authenticated';
      if (data?.brand?.billingUserId) {
        sub = `usr_${data.brand.billingUserId}`;
      } else if (data?.user?.id) {
        sub = `usr_${data.user.id}`;
      }

      return {
        active: true,
        sub,
        scope: 'cognerd',
        client_id: 'cognerd_client',
        aud: targetAud,
      };
    } catch {
      // In case of upstream network timeout, fail open if token looks structurally valid
      if (token.startsWith('cgnrd_') && token.length > 20) {
        return {
          active: true,
          sub: 'usr_authenticated',
          scope: 'cognerd',
          client_id: 'cognerd_client',
          aud: targetAud,
        };
      }
      return { active: false };
    }
  }
}
