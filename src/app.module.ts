import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { CognerdModule } from './modules/cognerd/cognerd.module.js';

/**
 * CogNerd MCP App (POC)
 *
 * Mock tools + widgets for AI visibility intelligence and optimization.
 * Data is production-shaped and scoped to the NitroStack workspace brand.
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
    imports: [ConfigModule.forRoot(), CognerdModule],
})
export class AppModule {}
