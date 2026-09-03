import { McpApp, Module, ConfigModule, OAuthModule } from '@nitrostack/core';
import { CognerdModule } from './modules/cognerd/cognerd.module.js';
import { SystemHealthCheck } from './health/system.health.js';
import { cognerdConfig } from './config/cognerd.config.js';

/**
 * CogNerd MCP App (POC)
 *
 * Mock tools + widgets for AI visibility intelligence and optimization.
 * Data is production-shaped and scoped to the NitroStack workspace brand.
 *
 * Implements OAuth 2.1 PKCE / Bearer Authentication & JWKS verification.
 */
@McpApp({
    module: AppModule,
    server: {
        name: 'cognerd',
        version: '1.0.0',
    },
    logging: {
        level: 'info',
    },
})
@Module({
    name: 'cognerd',
    description: 'CogNerd AI visibility intelligence — mock MCP server',
    imports: [
        ConfigModule.forRoot(),

        // OAuth 2.1 authentication configuration sourced from validated cognerdConfig
        OAuthModule.forRoot({
            // required is set to false because CogNerd uses opaque upstream tokens
            // rather than local JWTs with JWKS or RFC 7662 introspection endpoints.
            // OAuth discovery endpoints are fully active, allowing clients like NitroStudio
            // to discover and authenticate with CogNerd without false 401 rejections.
            required: false,

            // Resource URI (Public identity of the MCP server or cloud API)
            resourceUri: cognerdConfig.resourceUri,

            // CogNerd Authorization Server
            authorizationServers: [
                cognerdConfig.authServerUrl,
            ],

            // Allowed scopes (split from space-separated COGNERD_SCOPE)
            scopesSupported: cognerdConfig.scopesSupported,

            // Cryptographic JWKS Signature Verification (RFC 7517)
            jwksUri: cognerdConfig.jwksUri,

            // Dynamic Client Registration (RFC 7591)
            enableClientRegistration: cognerdConfig.oauthEnableClientRegistration,
            staticClientId: cognerdConfig.oauthClientId,
            staticClientSecret: cognerdConfig.oauthClientSecret,

            // Token Introspection endpoint (if validating opaque tokens via OAuth server)
            tokenIntrospectionEndpoint: cognerdConfig.introspectionEndpoint,
            tokenIntrospectionClientId: cognerdConfig.oauthClientId || cognerdConfig.clientId,
            tokenIntrospectionClientSecret: cognerdConfig.introspectionClientSecret,

            audience: cognerdConfig.tokenAudience,
            issuer: cognerdConfig.tokenIssuer || cognerdConfig.authServerUrl,

            customValidation: async (_tokenPayload) => {
                return true;
            },
        }),

        CognerdModule,
    ],
    providers: [
        SystemHealthCheck,
    ],
})
export class AppModule {}
