import { ToolDecorator as Tool, Widget, InitialTool, ExecutionContext, Injectable, UseGuards, z } from '@nitrostack/core';
import { CognerdService } from './cognerd.service.js';
import { OAuthGuard } from '../../guards/oauth.guard.js';
import {
    AGXP_EXAMPLE,
    AI_INSIGHTS_EXAMPLE,
    AI_READINESS_AUDIT_EXAMPLE,
    AI_VISIBILITY_EXAMPLE,
    AUDIENCE_PERSONAS_EXAMPLE,
    CITATIONS_EXAMPLE,
    COMPETITIVE_INTELLIGENCE_EXAMPLE,
    CONTENT_STUDIO_EXAMPLE,
    GEO_ASSETS_EXAMPLE,
    PROMPT_INTELLIGENCE_EXAMPLE,
    SCAN_HISTORY_EXAMPLE,
} from './cognerd.examples.js';

/**
 * CogNerd widget metadata. Logo is served from the widget app and cognerd.ai.
 */
function cognerdWidget(route: string) {
    return {
        route,
        prefersBorder: true,
        csp: {
            resourceDomains: ['https://cognerd.ai'],
        },
    };
}

const BrandScopeSchema = z.object({
    brandId: z
        .string()
        .optional()
        .describe('Brand id to scope results. Defaults to the active workspace brand (NitroStack).'),
});

const PromptIntelSchema = BrandScopeSchema.extend({
    status: z
        .enum(['new', 'active', 'archived'])
        .optional()
        .describe('Prompt tray to return. Omit for all prompts.'),
});

const VisibilitySchema = BrandScopeSchema.extend({
    engine: z
        .enum(['all', 'ChatGPT', 'Perplexity', 'Gemini', 'Claude', 'AI Overviews', 'Copilot', 'Grok'])
        .optional()
        .describe('Filter rows by AI engine'),
    mentioned: z
        .enum(['all', 'mentioned', 'cited', 'not_mentioned'])
        .optional()
        .describe('Filter by mention / citation state'),
});

const CitationsSchema = BrandScopeSchema.extend({
    engine: z
        .enum(['all', 'ChatGPT', 'Perplexity', 'Gemini', 'Claude', 'AI Overviews', 'Copilot', 'Grok'])
        .optional()
        .describe('Filter citations by originating engine'),
});

const ContentStudioSchema = BrandScopeSchema.extend({
    status: z
        .enum(['ready', 'in_progress', 'published', 'gap'])
        .optional()
        .describe('Filter content briefs by production status'),
});

@Injectable({ deps: [CognerdService] })
export class CognerdTools {
    constructor(private readonly cognerd: CognerdService) {}

    @Tool({
        name: 'whoami',
        description: 'Verify current authenticated user, visible brands, granted scopes, and wallet credit balance.',
        inputSchema: z.object({}),
    })
    @UseGuards(OAuthGuard)
    async whoami(_args: Record<string, any>, ctx: ExecutionContext) {
        const data = await this.cognerd.whoami();
        ctx.logger.info('WhoAmI', { user: data.user?.email, brands: data.brands?.length });
        return data;
    }

    @Tool({
        name: 'get_credit_balance',
        description: 'Retrieve current credit balance and neuron reservation status for the authenticated workspace.',
        inputSchema: z.object({}),
    })
    @UseGuards(OAuthGuard)
    async getCreditBalance(_args: Record<string, any>, ctx: ExecutionContext) {
        const data = await this.cognerd.getCreditBalance();
        ctx.logger.info('Credit balance', { balance: data.balance });
        return data;
    }

    @Tool({
        name: 'get_weak_prompts',
        description:
            'Find buyer intent prompts where this brand is losing or invisible in AI engine answers while competitors are cited.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    async getWeakPrompts(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getPromptIntelligence('new', args.brandId);
        ctx.logger.info('Weak prompts', { total: data.totalPrompts });
        return data;
    }

    @Tool({
        name: 'get_ai_insights',
        description:
            'Open the CogNerd AI Insights dashboard: visibility score, mentions, citations, drops, trend, and mentions by engine. Use this first for a brand health snapshot.',
        inputSchema: BrandScopeSchema,
        examples: AI_INSIGHTS_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    @InitialTool()
    async getAiInsights(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getAiInsights();
        ctx.logger.info('AI Insights', { brand: data.brand.name, score: data.metrics.visibilityScore });
        return data;
    }

    @Tool({
        name: 'get_audience_personas',
        description:
            'Show detected audience personas and ICP inputs used to seed CogNerd prompt scenarios for the brand.',
        inputSchema: BrandScopeSchema,
        examples: AUDIENCE_PERSONAS_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('audience-personas'))
    async getAudiencePersonas(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getAudiencePersonas(args.brandId);
        ctx.logger.info('Audience personas', { count: data.totalPersonas });
        return data;
    }

    @Tool({
        name: 'get_prompt_intelligence',
        description:
            'List buyer prompts in New or Active. Generate-style inventory of questions audiences ask AI engines about the brand.',
        inputSchema: PromptIntelSchema,
        examples: PROMPT_INTELLIGENCE_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('prompt-intelligence'))
    async getPromptIntelligence(args: z.infer<typeof PromptIntelSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getPromptIntelligence(args.status, args.brandId);
        ctx.logger.info('Prompt intelligence', { status: data.status, total: data.totalPrompts });
        return data;
    }

    @Tool({
        name: 'get_ai_visibility',
        description:
            'Every prompt the brand competes in, ranked by impact: mentioned, cited, position, sources, and engine.',
        inputSchema: VisibilitySchema,
        examples: AI_VISIBILITY_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-visibility'))
    async getAiVisibility(args: z.infer<typeof VisibilitySchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getAiVisibility({
            engine: args.engine,
            mentioned: args.mentioned,
        });
        ctx.logger.info('AI visibility', { rows: data.totalRows, filters: data.filters });
        return data;
    }

    @Tool({
        name: 'get_citations',
        description:
            'Every source AI engines cite when they mention the brand, plus owned pages that get picked up.',
        inputSchema: CitationsSchema,
        examples: CITATIONS_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('citations'))
    async getCitations(args: z.infer<typeof CitationsSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getCitations(args.engine);
        ctx.logger.info('Citations', { engine: data.engine, rows: data.totalCitations });
        return data;
    }

    @Tool({
        name: 'get_competitive_intelligence',
        description:
            'Share of voice, sentiment, mention velocity, and authority versus tracked competitors.',
        inputSchema: BrandScopeSchema,
        examples: COMPETITIVE_INTELLIGENCE_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('competitive-intelligence'))
    async getCompetitiveIntelligence(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getCompetitiveIntelligence();
        ctx.logger.info('Competitive intelligence', { tracked: data.trackedBrands });
        return data;
    }

    @Tool({
        name: 'get_scan_history',
        description:
            'Past CogNerd analysis runs: status, dates, prompt volume, mentions, citations, and visibility score movement.',
        inputSchema: BrandScopeSchema,
        examples: SCAN_HISTORY_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('scan-history'))
    async getScanHistory(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getScanHistory();
        ctx.logger.info('Scan history', { runs: data.totalRuns });
        return data;
    }

    @Tool({
        name: 'get_ai_readiness_audit',
        description:
            'AEO / answer-readiness audit: crawl score, schema, chunk structure, entity clarity, and citation-surface findings.',
        inputSchema: BrandScopeSchema,
        examples: AI_READINESS_AUDIT_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-readiness-audit'))
    async getAiReadinessAudit(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getAiReadinessAudit();
        ctx.logger.info('AI readiness audit', { score: data.score, grade: data.grade });
        return data;
    }

    @Tool({
        name: 'get_geo_assets',
        description:
            'GEO assets for the brand: llms.txt, schema, robots, entity graph, FAQ extract, and AI sitemap — plus publish status.',
        inputSchema: BrandScopeSchema,
        examples: GEO_ASSETS_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('geo-assets'))
    async getGeoAssets(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getGeoAssets();
        ctx.logger.info('GEO assets', { total: data.totalAssets, published: data.published });
        return data;
    }

    @Tool({
        name: 'get_agxp',
        description:
            'AGXP (AI Growth Experience Platform) loop: Connect, Presence, Prompts, Gaps, Publish, and Lift scores for the brand.',
        inputSchema: BrandScopeSchema,
        examples: AGXP_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('agxp'))
    async getAgxp(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getAgxp();
        ctx.logger.info('AGXP', { loopScore: data.loopScore });
        return data;
    }

    @Tool({
        name: 'get_content_studio',
        description:
            'Content Studio briefs generated from visibility gaps: target prompt, outline, estimated citation lift, and production status.',
        inputSchema: ContentStudioSchema,
        examples: CONTENT_STUDIO_EXAMPLE,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async getContentStudio(args: z.infer<typeof ContentStudioSchema>, ctx: ExecutionContext) {
        const data = await this.cognerd.getContentStudio(args.status);
        ctx.logger.info('Content studio', { status: data.status, total: data.totalBriefs });
        return data;
    }
}
