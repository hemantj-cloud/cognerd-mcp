import { Module } from '@nitrostack/core';
import { CognerdService } from './cognerd.service.js';
import { CognerdTools } from './cognerd.tools.js';
import { OAuthService } from '../../services/oauth.service.js';
import { CognerdApiClient } from '../../services/cognerd-api.client.js';

@Module({
    name: 'cognerd',
    description: 'CogNerd AI visibility intelligence and optimization MCP app',
    controllers: [CognerdTools],
    providers: [CognerdService, OAuthService, CognerdApiClient],
    exports: [OAuthService, CognerdApiClient],
})
export class CognerdModule {}

