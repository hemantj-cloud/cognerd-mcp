#!/usr/bin/env node
/**
 * CogNerd MCP Server
 *
 * AI visibility intelligence and optimization widgets.
 * Built with NitroStack Framework (@nitrostack/core)
 *
 * Compliant with:
 * - Model Context Protocol (MCP) specification
 * - OAuth 2.1 PKCE (S256) & Bearer Token Authentication
 */

import 'dotenv/config';
import { DIContainer, McpApplicationFactory, OAuthModule } from '@nitrostack/core';
import { AppModule } from './app.module.js';
import { cognerdConfig } from './config/cognerd.config.js';

async function bootstrap() {
    try {
        console.error('🚀 Starting CogNerd MCP Server (NitroStack)...');
        console.error(`   Resource URI: ${cognerdConfig.resourceUri}`);
        console.error(`   Auth Server:  ${cognerdConfig.authServerUrl}`);
        console.error(`   Client ID:    ${cognerdConfig.clientId}`);
        console.error(`   Scope:        ${cognerdConfig.scope}`);
        console.error(`   PKCE Method:  ${cognerdConfig.codeChallengeMethod}`);
        console.error(`   Mock Mode:    ${cognerdConfig.isMockMode ? 'ENABLED (Offline/Sandbox)' : 'DISABLED (Live Endpoints)'}`);
        console.error(`   OAuth Guard:  ${cognerdConfig.oauthRequired ? 'ENFORCED (OAUTH_REQUIRED=true)' : 'PERMISSIVE (Dev Mode)'}\n`);

        // Create the MCP application
        const server = await McpApplicationFactory.create(AppModule);

        if (!OAuthModule.getConfig()) {
            DIContainer.getInstance().registerValue(
                OAuthModule,
                Object.create(null) as OAuthModule,
            );
        }

        // Start the server
        await server.start();
        console.error('✅ CogNerd MCP Server successfully started and ready for MCP client connections.\n');
    } catch (error) {
        console.error('❌ Failed to start CogNerd MCP Server:', error);
        process.exit(1);
    }
}

// Start application
bootstrap();
