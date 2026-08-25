import { Module } from '@nitrostack/core';
import { CognerdService } from './cognerd.service.js';
import { CognerdTools } from './cognerd.tools.js';

@Module({
    name: 'cognerd',
    description: 'CogNerd AI visibility intelligence and optimization (mock POC)',
    controllers: [CognerdTools],
    providers: [CognerdService],
})
export class CognerdModule {}
