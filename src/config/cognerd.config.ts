import 'dotenv/config';
import { z } from 'zod';

/**
 * Strict Environment Variable Validation Schema
 * Enforces fail-fast startup if any required environment variable is missing or malformed.
 */
const EnvSchema = z.object({
  // =============================================================================
  // Server & OAuth 2.1 Configuration
  // =============================================================================
  RESOURCE_URI: z
    .string({ required_error: 'RESOURCE_URI is required' })
    .url('RESOURCE_URI must be a valid URL (e.g. https://mcplocal or your deployed MCP URL)'),
  AUTH_SERVER_URL: z
    .string({ required_error: 'AUTH_SERVER_URL is required' })
    .url('AUTH_SERVER_URL must be a valid URL (e.g. https://dev-yourtenant.us.auth0.com)'),
  OAUTH_REQUIRED: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  JWKS_URI: z
    .string()
    .url('JWKS_URI must be a valid URL')
    .optional(),
  TOKEN_AUDIENCE: z.string().optional(),
  TOKEN_ISSUER: z.string().optional(),

  // Dynamic Client Registration & OAuth Credentials
  OAUTH_ENABLE_CLIENT_REGISTRATION: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),

  // Token Introspection (Optional)
  INTROSPECTION_ENDPOINT: z.string().optional(),
  INTROSPECTION_CLIENT_SECRET: z.string().optional(),

  // =============================================================================
  // CogNerd API Integration Settings (with defaults for standalone OAuth execution)
  // =============================================================================
  COGNERD_API_BASE_URL: z
    .string()
    .url('COGNERD_API_BASE_URL must be a valid URL')
    .optional()
    .default('https://mcp-185-131-53-177.sslip.io'),
  COGNERD_CLIENT_ID: z.string().optional(),
  COGNERD_AUTH_URL: z
    .string()
    .url('COGNERD_AUTH_URL must be a valid URL')
    .optional(),
  COGNERD_TOKEN_URL: z
    .string()
    .url('COGNERD_TOKEN_URL must be a valid URL')
    .optional(),
  COGNERD_REDIRECT_URI: z
    .string()
    .url('COGNERD_REDIRECT_URI must be a valid URL')
    .optional()
    .default('http://localhost:3005/auth/callback'),
  COGNERD_SCOPE: z.string().optional().default('cognerd'),
  COGNERD_ACCESS_TOKEN: z.string().optional(),
  COGNERD_MOCK_MODE: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val !== 'false'),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

export interface CognerdConfig {
  // OAuth 2.1 & Server Settings
  resourceUri: string;
  authServerUrl: string;
  oauthRequired: boolean;
  jwksUri?: string;
  tokenAudience: string;
  tokenIssuer?: string;
  oauthEnableClientRegistration: boolean;
  oauthClientId?: string;
  oauthClientSecret?: string;
  introspectionEndpoint?: string;
  introspectionClientSecret?: string;

  // CogNerd API & OAuth Client Settings
  apiBaseUrl: string;
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string;
  scopesSupported: string[];
  codeChallengeMethod: 'S256';
  tokenLifetimeDays: number;
  accessToken?: string;
  isMockMode: boolean;
}

/**
 * Loads, validates, and freezes application configuration with fail-fast enforcement.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): CognerdConfig {
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - [${err.path.join('.')}]: ${err.message}`)
      .join('\n');

    const errorMessage = `\n❌ FATAL: CogNerd MCP Server environment configuration error (Fail-Fast):\n${errorDetails}\n\n👉 Please configure all required environment variables in your .env file or deployment environment.\n`;

    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const parsed = result.data;
  const clientId = parsed.COGNERD_CLIENT_ID || parsed.OAUTH_CLIENT_ID || 'nitrostack_mcp';
  const authUrl = parsed.COGNERD_AUTH_URL || `${parsed.AUTH_SERVER_URL}/authorize`;
  const tokenUrl = parsed.COGNERD_TOKEN_URL || `${parsed.AUTH_SERVER_URL}/token`;
  const clientSecret = parsed.OAUTH_CLIENT_SECRET || parsed.INTROSPECTION_CLIENT_SECRET;

  return Object.freeze({
    resourceUri: parsed.RESOURCE_URI,
    authServerUrl: parsed.AUTH_SERVER_URL,
    oauthRequired: parsed.OAUTH_REQUIRED ?? false,
    jwksUri: parsed.JWKS_URI,
    tokenAudience: parsed.TOKEN_AUDIENCE || parsed.RESOURCE_URI,
    tokenIssuer: parsed.TOKEN_ISSUER || parsed.AUTH_SERVER_URL,
    oauthEnableClientRegistration: parsed.OAUTH_ENABLE_CLIENT_REGISTRATION ?? false,
    oauthClientId: parsed.OAUTH_CLIENT_ID,
    oauthClientSecret: clientSecret,
    introspectionEndpoint: parsed.INTROSPECTION_ENDPOINT,
    introspectionClientSecret: clientSecret,

    apiBaseUrl: parsed.COGNERD_API_BASE_URL,
    clientId,
    authUrl,
    tokenUrl,
    redirectUri: parsed.COGNERD_REDIRECT_URI,
    scope: parsed.COGNERD_SCOPE,
    // COGNERD_SCOPE is space-separated in .env; discovery metadata needs discrete entries
    scopesSupported: parsed.COGNERD_SCOPE.split(/\s+/).filter(Boolean),
    codeChallengeMethod: 'S256' as const,
    tokenLifetimeDays: 30,
    accessToken: parsed.COGNERD_ACCESS_TOKEN || undefined,
    isMockMode: parsed.COGNERD_MOCK_MODE ?? true,
  });
}

export const cognerdConfig: CognerdConfig = loadConfig();
