import express from 'express';
import crypto from 'crypto';
import { Injectable, DIContainer, NitroStackServer } from '@nitrostack/core';
import { cognerdConfig } from '../config/cognerd.config.js';
import { OAuthIntrospectionService } from './oauth-introspection.service.js';

interface AuthCodeRecord {
  token: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  redirectUri: string;
  clientId: string;
  expiresAt: number;
}

// In-memory store for authorization codes (10 minute expiry)
const authCodeStore = new Map<string, AuthCodeRecord>();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, record] of authCodeStore.entries()) {
    if (record.expiresAt < now) {
      authCodeStore.delete(code);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Derives the public base URL for this MCP server gateway.
 */
function getGatewayBaseUrl(req?: express.Request): string {
  if (cognerdConfig.resourceUri) {
    try {
      const parsed = new URL(cognerdConfig.resourceUri);
      return parsed.origin;
    } catch {
      // fallback
    }
  }
  if (req) {
    const rawProto = req.headers['x-forwarded-proto'];
    const proto = Array.isArray(rawProto) ? rawProto[0] : (rawProto || (req.secure ? 'https' : 'http'));
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

async function validateUserToken(token: string): Promise<boolean> {
  if (!token) return false;
  if (cognerdConfig.accessToken && token === cognerdConfig.accessToken) return true;

  try {
    const cookieHeader = token.includes('session_token=')
      ? token
      : `__Secure-better-auth.session_token=${token}; better-auth.session_token=${token}`;

    const res = await fetch(`${cognerdConfig.restBaseUrl}/api/brand-monitor/brand-profile/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cookie': cookieHeader,
      },
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Creates the complete OAuth 2.1 Gateway Express Router supporting:
 * - RFC 8414 OAuth Authorization Server Metadata (with CIMD & DCR)
 * - RFC 9728 Protected Resource Metadata
 * - RFC 7591 Dynamic Client Registration (DCR)
 * - OAuth 2.1 PKCE Authorization Endpoint (/oauth/v2/authorize)
 * - OAuth 2.1 Token Endpoint (/oauth/v2/token)
 */
export function createOAuthGatewayRouter(): express.Router {
  const router = express.Router();

  // Support parsing JSON and form-urlencoded bodies
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  // Common CORS headers
  const setCorsHeaders = (res: express.Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Mcp-Session-Id');
  };

  // =============================================================================
  // 1. RFC 8414: OAuth 2.1 Authorization Server Metadata
  // =============================================================================
  router.get('/.well-known/oauth-authorization-server', (req: express.Request, res: express.Response) => {
    setCorsHeaders(res);
    const base = getGatewayBaseUrl(req);
    const scopes = cognerdConfig.scopesSupported.length > 0 ? cognerdConfig.scopesSupported : ['cognerd'];

    res.json({
      issuer: base,
      authorization_endpoint: `${base}/oauth/v2/authorize`,
      token_endpoint: `${base}/oauth/v2/token`,
      registration_endpoint: `${base}/oauth/v2/register`,
      introspection_endpoint: `${base}/oauth/introspect`,
      client_id_metadata_document_supported: true,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      scopes_supported: scopes,
    });
  });

  // =============================================================================
  // 2. RFC 9728: Protected Resource Metadata
  // =============================================================================
  router.get('/.well-known/oauth-protected-resource', (req: express.Request, res: express.Response) => {
    setCorsHeaders(res);
    const base = getGatewayBaseUrl(req);
    const scopes = cognerdConfig.scopesSupported.length > 0 ? cognerdConfig.scopesSupported : ['cognerd'];

    res.json({
      resource: `${base}/mcp`,
      authorization_servers: [base],
      scopes_supported: scopes,
      bearer_methods_supported: ['header'],
    });
  });

  // =============================================================================
  // 3. RFC 7591: Dynamic Client Registration (DCR)
  // =============================================================================
  const handleRegistration = (req: express.Request, res: express.Response) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    const body = req.body || {};
    const clientName = body.client_name || 'ChatGPT';
    const cleanName = String(clientName).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const clientId = `cognerd-${cleanName}`;
    const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];

    res.status(201).json({
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: body.grant_types || ['authorization_code', 'refresh_token'],
      response_types: body.response_types || ['code'],
      token_endpoint_auth_method: body.token_endpoint_auth_method || 'none',
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0,
    });
  };

  router.post('/oauth/v2/register', handleRegistration);
  router.post('/register', handleRegistration);
  router.options('/oauth/v2/register', handleRegistration);
  router.options('/register', handleRegistration);

  // =============================================================================
  // 4. OAuth 2.1 Interactive Authorization Page (GET)
  // =============================================================================
  const handleAuthorizeGet = (req: express.Request, res: express.Response) => {
    setCorsHeaders(res);
    const clientId = (req.query.client_id as string) || '';
    const redirectUri = (req.query.redirect_uri as string) || '';
    const responseType = (req.query.response_type as string) || 'code';
    const codeChallenge = (req.query.code_challenge as string) || '';
    const codeChallengeMethod = (req.query.code_challenge_method as string) || 'S256';
    const state = (req.query.state as string) || '';
    const scope = (req.query.scope as string) || 'cognerd';
    const hasDefaultToken = !!cognerdConfig.accessToken;

    if (!redirectUri) {
      return res.status(400).send('<h3>Error: Missing required redirect_uri parameter.</h3>');
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize CogNerd MCP Connector</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent: #10b981;
      --error: #ef4444;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-family);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 36px;
      max-width: 440px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 8px 0;
      font-weight: 700;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .field {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 6px;
      color: #d1d5db;
    }
    input[type="text"], input[type="email"], input[type="password"] {
      width: 100%;
      box-sizing: border-box;
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 10px 12px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: var(--primary);
    }
    .btn {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: background 0.2s;
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      margin-top: 8px;
    }
    .btn-primary:hover {
      background: var(--primary-hover);
    }
    .btn-quick {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      margin-bottom: 20px;
    }
    .btn-quick:hover {
      background: rgba(16, 185, 129, 0.25);
    }
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
      margin: 20px 0;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--card-border);
    }
    .divider::before { margin-right: 12px; }
    .divider::after { margin-left: 12px; }
    .footer-note {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      margin-top: 24px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-badge">⚡ CogNerd MCP Gateway</div>
    <h1>Connect to ChatGPT</h1>
    <p class="subtitle">Authorize ChatGPT to access your CogNerd brand monitor, visibility intelligence, and marketing tools.</p>

    ${hasDefaultToken ? `
    <form method="POST" action="/oauth/v2/authorize" style="margin-bottom: 16px;">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="response_type" value="${responseType}">
      <input type="hidden" name="code_challenge" value="${codeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod}">
      <input type="hidden" name="state" value="${state}">
      <input type="hidden" name="scope" value="${scope}">
      <input type="hidden" name="use_default" value="true">
      <button type="submit" class="btn btn-quick">⚡ Quick Authorize (Active Workspace)</button>
    </form>
    <div class="divider">OR SIGN IN WITH ACCOUNT</div>
    ` : ''}

    <form method="POST" action="/oauth/v2/authorize">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="response_type" value="${responseType}">
      <input type="hidden" name="code_challenge" value="${codeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod}">
      <input type="hidden" name="state" value="${state}">
      <input type="hidden" name="scope" value="${scope}">

      <div class="field">
        <label for="email">CogNerd Email</label>
        <input type="email" id="email" name="email" placeholder="name@company.com">
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="••••••••">
      </div>

      <div class="divider">OR USE PERSONAL ACCESS TOKEN</div>

      <div class="field">
        <label for="token">Personal Access Token (PAT) / Session Cookie</label>
        <input type="text" id="token" name="token" placeholder="Paste cgnrd_ PAT or session token">
      </div>

      <button type="submit" class="btn btn-primary">Approve Access</button>
    </form>

    <div class="footer-note">
      Connecting to: <strong>https://api.cognerd.in</strong><br>
      Your token is scoped strictly to your visible CogNerd brands.
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  };

  router.get('/oauth/v2/authorize', handleAuthorizeGet);
  router.get('/authorize', handleAuthorizeGet);

  // =============================================================================
  // 5. OAuth 2.1 Form Submission Authorization (POST)
  // =============================================================================
  const handleAuthorizePost = async (req: express.Request, res: express.Response) => {
    setCorsHeaders(res);
    const clientId = (req.body.client_id as string) || '';
    const redirectUri = (req.body.redirect_uri as string) || '';
    const codeChallenge = (req.body.code_challenge as string) || '';
    const codeChallengeMethod = (req.body.code_challenge_method as string) || 'S256';
    const state = (req.body.state as string) || '';
    const useDefault = req.body.use_default === 'true';

    if (!redirectUri) {
      return res.status(400).send('Missing redirect_uri');
    }

    let userToken = '';

    if (useDefault && cognerdConfig.accessToken) {
      userToken = cognerdConfig.accessToken;
    } else if (req.body.token && String(req.body.token).trim()) {
      userToken = String(req.body.token).trim();
    } else if (req.body.email && req.body.password) {
      // Exchange email & password directly with live upstream CogNerd Better-Auth
      try {
        const signinRes = await fetch(`${cognerdConfig.apiBaseUrl}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email: String(req.body.email).trim(),
            password: String(req.body.password),
          }),
        });

        if (!signinRes.ok) {
          const errText = await signinRes.text();
          return res.status(401).send(`<h3>Authentication Failed: Invalid email or password</h3><p>${errText}</p><a href="javascript:history.back()">Go Back</a>`);
        }

        // Extract token from set-cookie or JSON response
        const cookies = signinRes.headers.get('set-cookie');
        if (cookies) {
          const match = cookies.match(/(?:better-auth\.session_token|session_token)=([^;]+)/);
          if (match) {
            userToken = decodeURIComponent(match[1]);
          }
        }

        if (!userToken) {
          const data = (await signinRes.json().catch(() => null)) as any;
          userToken = data?.token || data?.session?.token || data?.user?.token || '';
        }
      } catch (err: any) {
        return res.status(502).send(`<h3>Failed to reach CogNerd upstream</h3><p>${err.message}</p><a href="javascript:history.back()">Go Back</a>`);
      }
    }

    if (!userToken) {
      return res.status(400).send('<h3>Please provide your email & password or personal access token.</h3><a href="javascript:history.back()">Go Back</a>');
    }

    // Verify token validity with live introspection service
    const isValid = await validateUserToken(userToken);
    if (!isValid) {
      return res.status(401).send('<h3>Invalid token: CogNerd rejected this session or PAT.</h3><a href="javascript:history.back()">Go Back</a>');
    }

    // Generate a secure single-use authorization code
    const authCode = crypto.randomBytes(32).toString('hex');
    authCodeStore.set(authCode, {
      token: userToken,
      codeChallenge,
      codeChallengeMethod,
      redirectUri,
      clientId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // 302 Redirect back to ChatGPT's redirect_uri with code & state
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', authCode);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    res.redirect(302, callbackUrl.toString());
  };

  router.post('/oauth/v2/authorize', handleAuthorizePost);
  router.post('/authorize', handleAuthorizePost);

  // =============================================================================
  // 6. OAuth 2.1 Token Exchange Endpoint (POST)
  // =============================================================================
  const handleTokenPost = (req: express.Request, res: express.Response) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    const grantType = req.body.grant_type;
    const code = req.body.code;
    const codeVerifier = req.body.code_verifier;

    if (grantType !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant is supported',
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing code parameter',
      });
    }

    const record = authCodeStore.get(code);
    if (!record) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code',
      });
    }

    if (record.expiresAt < Date.now()) {
      authCodeStore.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code has expired',
      });
    }

    // PKCE Verification
    if (record.codeChallenge) {
      if (!codeVerifier) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Missing code_verifier for PKCE validation',
        });
      }

      const computedChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      if (computedChallenge !== record.codeChallenge) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'PKCE challenge verification failed',
        });
      }
    }

    // Code is single-use
    authCodeStore.delete(code);

    res.json({
      access_token: record.token,
      token_type: 'Bearer',
      expires_in: 2592000, // 30 days
      scope: 'cognerd',
    });
  };

  router.post('/oauth/v2/token', handleTokenPost);
  router.post('/token', handleTokenPost);
  router.options('/oauth/v2/token', handleTokenPost);
  router.options('/token', handleTokenPost);

  return router;
}

/**
 * Attaches the OAuth Gateway router to an Express application,
 * inserting it at the top of the stack so it intercepts discovery, DCR, and OAuth routes.
 */
export function setupOAuthGateway(app: express.Application): void {
  if (!app) return;

  const router = createOAuthGatewayRouter();
  app.use(router);

  // In Express 4, app.use appends to the end of app._router.stack.
  // We move the newly added layer to index 2 (right after expressInit and query middleware)
  // so discovery, DCR, authorize, and token routes take priority over generic catch-all routes.
  if ((app as any)._router && Array.isArray((app as any)._router.stack)) {
    const stack = (app as any)._router.stack;
    const gatewayLayer = stack.pop();
    if (gatewayLayer) {
      stack.splice(2, 0, gatewayLayer);
    }
  }
}

/**
 * Injectable Service registered in AppModule that automatically hooks into
 * NitroStack's onApplicationBootstrap lifecycle.
 */
@Injectable()
export class OAuthGatewayService {
  async onApplicationBootstrap(): Promise<void> {
    try {
      const server = DIContainer.getInstance().resolve<NitroStackServer>('NitroStackServer');
      const httpTransport = (server as any)?.getHttpTransport?.();
      const app = httpTransport?.getApp?.();
      if (app) {
        setupOAuthGateway(app);
      }
    } catch {
      // In isolated test runner or stdio mode, ignore
    }
  }
}
