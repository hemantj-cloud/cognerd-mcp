import { Module } from '@nitrostack/core';
import { CognerdService } from './cognerd.service.js';
import { CognerdTools } from './cognerd.tools.js';
import { OAuthService } from '../../services/oauth.service.js';

@Module({
    name: 'cognerd',
    description: 'CogNerd AI visibility intelligence and optimization (mock POC)',
    controllers: [CognerdTools],
    providers: [CognerdService, OAuthService],
    exports: [OAuthService],
})
export class CognerdModule {}
