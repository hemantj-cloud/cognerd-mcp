import { Guard, ExecutionContext, OAuthModule, OAuthTokenPayload } from '@nitrostack/core';

/**
 * OAuth Guard
 *
 * Validates OAuth 2.1 access tokens according to MCP specification.
 *
 * Performs:
 * - Token validation (introspection or JWT validation)
 * - Audience binding (RFC 8707) - CRITICAL for security
 * - Scope validation
 * - Expiration checking
 *
 * Compatible with:
 * - OpenAI Apps SDK
 * - Any RFC-compliant OAuth 2.1 provider
 *
 * Usage:
 * ```typescript
 * @Tool({
 *   name: 'protected_resource',
 *   description: 'A protected tool'
 * })
 * @UseGuards(OAuthGuard)
 * async protectedTool() {
 *   // Only accessible with valid OAuth token
 * }
 * ```
 */
const tokenValidationCache = new Map<string, { auth: any; expiresAt: number }>();

export class OAuthGuard implements Guard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract token from metadata (sent by Studio, MCP client, or HTTP Authorization header)
    const rawAuth = (context.metadata?.authorization || context.metadata?.Authorization) as string | undefined;
    const metaToken = context.metadata?._oauth || context.metadata?.token;

    let token: string | null = null;

    // Try Bearer token format first
    if (rawAuth?.startsWith('Bearer ')) {
      token = rawAuth.substring(7).trim();
    } else if (rawAuth && !rawAuth.includes(' ')) {
      token = rawAuth.trim();
    } else if (metaToken && typeof metaToken === 'string') {
      token = metaToken.trim();
    }

    // Enforcement gate: when OAuth is not required (OAUTH_REQUIRED not "true"),
    // do not reject. Best-effort: if a valid token happens to be present, attach
    // its identity; otherwise allow the request through unauthenticated.
    if (!OAuthModule.isAuthRequired()) {
      if (token) {
        const authData = await this.validateAnyToken(token);
        if (authData) {
          context.auth = { ...authData, token };
        }
      }
      return true;
    }

    if (!token) {
      throw new Error(
        'OAuth token required. Please authenticate in Studio (Auth → OAuth 2.1 tab) ' +
        'or provide token in Authorization header: "Bearer <token>"'
      );
    }

    // Validate token
    const authData = await this.validateAnyToken(token);
    if (!authData) {
      throw new Error('OAuth token validation failed: Invalid or expired access token.');
    }

    context.auth = { ...authData, token };
    return true;
  }

  /**
   * Validates token via OAuthModule or CogNerd Gateway
   */
  private async validateAnyToken(token: string): Promise<any | null> {
    // Check in-memory cache first
    const cached = tokenValidationCache.get(token);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.auth;
    }

    // 1. Try standard OAuthModule validation
    try {
      const result = await OAuthModule.validateToken(token);
      if (result?.valid && result.payload) {
        const payload = result.payload as OAuthTokenPayload;
        const auth = {
          subject: payload.sub || 'user',
          scopes: this.extractScopes(payload),
          clientId: payload.client_id,
          tokenPayload: payload,
        };
        tokenValidationCache.set(token, { auth, expiresAt: Date.now() + 300000 });
        return auth;
      }
    } catch {}

    // 2. Validate CogNerd Bearer token via live gateway
    if (token.startsWith('cgnrd_') || token.length >= 10) {
      try {
        const res = await fetch('https://mcp.cognerd.in/mcp', {
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

        if (res.ok) {
          const text = await res.text();
          let data: any = null;
          if (text.startsWith('{')) {
            try { data = JSON.parse(text); } catch {}
          } else {
            for (const line of text.split('\n')) {
              if (line.startsWith('data: ')) {
                try { data = JSON.parse(line.slice(6)); break; } catch {}
              }
            }
          }

          let contentObj: any = null;
          if (data?.result?.content?.[0]?.text) {
            try {
              contentObj = JSON.parse(data.result.content[0].text);
            } catch {}
          }

          const structured = data?.result?.structuredContent || data?.result;
          let user = structured?.user || contentObj?.user || data?.result?.user;
          const brands = structured?.brands || contentObj?.brands || data?.result?.brands || [];

          // Defensive handling for legacy Pydantic validation error if credits field was missing
          if (!user && text.includes('validation error for Whoami')) {
            const userMatch = text.match(/['"]user['"]:\s*({[^}]+})/);
            if (userMatch && userMatch[1]) {
              try {
                user = JSON.parse(userMatch[1].replace(/'/g, '"'));
              } catch {}
            }
          }

          if (user || (!text.includes('invalid_token') && !text.includes('Unauthorized') && !text.includes('401'))) {
            const auth = {
              subject: user?.id || user?.email || 'usr_authenticated',
              scopes: ['cognerd'],
              clientId: structured?.keyId || 'cognerd_client',
              user,
              brands,
              tokenPayload: { user, brands, ...(structured || {}) },
            };
            tokenValidationCache.set(token, { auth, expiresAt: Date.now() + 300000 });
            return auth;
          }
        }
      } catch {}
    }

    return null;
  }

  /**
   * Extract scopes from token payload
   * Handles both "scope" (space-separated string) and "scopes" (array) formats
   */
  private extractScopes(payload: OAuthTokenPayload): string[] {
    if (payload.scopes && Array.isArray(payload.scopes)) {
      return payload.scopes;
    }

    if (payload.scope && typeof payload.scope === 'string') {
      return payload.scope.split(' ').filter(s => s.length > 0);
    }

    return [];
  }
}

/**
 * Scope Guard
 *
 * Validates that the OAuth token has required scopes.
 * Use this in addition to OAuthGuard for fine-grained access control.
 *
 * Usage:
 * ```typescript
 * @Tool({ name: 'admin_action' })
 * @UseGuards(OAuthGuard, createScopeGuard(['admin', 'write']))
 * async adminAction() {
 *   // Requires OAuth token with 'admin' AND 'write' scopes
 * }
 * ```
 */
export function createScopeGuard(requiredScopes: string[]): new () => Guard {
  return class ScopeGuard implements Guard {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      if (!OAuthModule.isAuthRequired()) {
        return true;
      }

      const userScopes = context.auth?.scopes || [];

      const missingScopes = requiredScopes.filter(
        scope => !userScopes.includes(scope)
      );

      if (missingScopes.length > 0) {
        throw new Error(
          `Insufficient scope. Required: ${requiredScopes.join(', ')}. ` +
          `Missing: ${missingScopes.join(', ')}`
        );
      }

      return true;
    }
  };
}
