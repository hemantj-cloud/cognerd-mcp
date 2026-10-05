import { ToolDecorator as Tool, Widget, InitialTool, ExecutionContext, Injectable, UseGuards, z } from '@nitrostack/core';
import { CognerdService } from './cognerd.service.js';
import { OAuthGuard } from '../../guards/oauth.guard.js';

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

function extractToken(ctx: ExecutionContext): string | undefined {
    const rawAuth = (ctx.metadata?.authorization || ctx.metadata?.Authorization) as string | undefined;
    if (rawAuth?.startsWith('Bearer ')) {
        return rawAuth.substring(7).trim();
    }
    if (rawAuth && !rawAuth.includes(' ') && (rawAuth.startsWith('cgnrd_') || rawAuth.length >= 10)) {
        return rawAuth.trim();
    }
    return (ctx.auth as any)?.token || (ctx.metadata?._oauth as string) || (ctx.metadata?.token as string) || undefined;
}

const BrandScopeSchema = z.object({
    brandId: z
        .string()
        .optional()
        .describe('Brand id to scope results. Defaults to the active workspace brand.'),
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
        description: 'Verify current authenticated user, visible brands, granted scopes, and workspace run allowances. Standalone tool.',
        inputSchema: z.object({}),
    })
    @Widget(cognerdWidget('whoami'))
    @UseGuards(OAuthGuard)
    async whoami(_args: Record<string, any>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.whoami(token);
        ctx.logger.info('WhoAmI', { user: data.user?.email, brands: data.brands?.length });
        return data;
    }

    @Tool({
        name: 'get_run_allowance',
        description:
            'Retrieve active run, brief, and daily tool call allowances and reset windows per the CogNerd Run System. Standalone tool.',
        inputSchema: z.object({}),
    })
    @Widget(cognerdWidget('run-allowance'))
    @UseGuards(OAuthGuard)
    async getRunAllowance(_args: Record<string, any>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getRunAllowance(token);
        ctx.logger.info('Run allowance', { plan: data.plan?.name, runsRemaining: data.allowances?.['runs.monthly']?.remaining });
        return data;
    }

    @Tool({
        name: 'get_credit_balance',
        description: 'Deprecated legacy compatibility tool: returns workspace allowance status (superseded by get_run_allowance per CogNerd Run System specification). Standalone tool.',
        inputSchema: z.object({}),
    })
    @Widget(cognerdWidget('run-allowance'))
    @UseGuards(OAuthGuard)
    async getCreditBalance(_args: Record<string, any>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getCreditBalance(token);
        ctx.logger.info('Run allowance (legacy)', { plan: data.plan?.name });
        return data;
    }

    @Tool({
        name: 'get_weak_prompts',
        description:
            'Retrieve ONLY weak or losing prompt opportunities where the brand has low visibility. Standalone tool: DO NOT invoke alongside get_prompt_intelligence, get_ai_visibility, or other tools in the same turn.',
        inputSchema: BrandScopeSchema,
    })
    @Widget(cognerdWidget('prompt-intelligence'))
    @UseGuards(OAuthGuard)
    async getWeakPrompts(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getPromptIntelligence('new', args.brandId, token);
        ctx.logger.info('Weak prompts', { total: data.totalPrompts });
        return data;
    }

    @Tool({
        name: 'get_ai_insights',
        description:
            'Open the CogNerd AI Insights overview dashboard: visibility score, mentions, citations, drops, trend, and mentions by engine. Standalone tool: DO NOT invoke alongside get_ai_visibility or get_citations.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    @InitialTool()
    async getAiInsights(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getAiInsights(token);
        ctx.logger.info('AI Insights', { brand: data.brand?.name, score: data.metrics?.visibilityScore });
        return data;
    }

    @Tool({
        name: 'get_audience_personas',
        description:
            'Show detected audience personas and ICP inputs used to seed CogNerd prompt scenarios for the brand. Standalone tool.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('audience-personas'))
    async getAudiencePersonas(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getAudiencePersonas(args.brandId, token);
        ctx.logger.info('Audience personas', { count: data.totalPersonas });
        return data;
    }

    @Tool({
        name: 'get_prompt_intelligence',
        description:
            'Retrieve the active prompt scenario catalog and buyer question inventory. Standalone tool: DO NOT invoke if user asks specifically for weak prompts, citations, or visibility table.',
        inputSchema: PromptIntelSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('prompt-intelligence'))
    async getPromptIntelligence(args: z.infer<typeof PromptIntelSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getPromptIntelligence(args.status, args.brandId, token);
        ctx.logger.info('Prompt intelligence', { status: data.status, total: data.totalPrompts });
        return data;
    }

    @Tool({
        name: 'get_ai_visibility',
        description:
            'Retrieve the detailed AI engine visibility matrix and citation table (positions, mention rates, sources). Standalone tool: DO NOT invoke alongside get_weak_prompts or get_prompt_intelligence.',
        inputSchema: VisibilitySchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-visibility'))
    async getAiVisibility(args: z.infer<typeof VisibilitySchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getAiVisibility({
            engine: args.engine,
            mentioned: args.mentioned,
        }, token);
        ctx.logger.info('AI visibility', { rows: data.totalRows, filters: data.filters });
        return data;
    }

    @Tool({
        name: 'get_citations',
        description:
            'Every source AI engines cite when they mention the brand, plus owned pages that get picked up. Standalone tool: DO NOT invoke alongside get_ai_visibility.',
        inputSchema: CitationsSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('citations'))
    async getCitations(args: z.infer<typeof CitationsSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getCitations(args.engine, token);
        ctx.logger.info('Citations', { engine: data.engine, rows: data.totalCitations });
        return data;
    }

    @Tool({
        name: 'get_competitive_intelligence',
        description:
            'Share of voice, sentiment, mention velocity, and authority versus tracked competitors. Standalone tool.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('competitive-intelligence'))
    async getCompetitiveIntelligence(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getCompetitiveIntelligence(token);
        ctx.logger.info('Competitive intelligence', { tracked: data.trackedBrands });
        return data;
    }

    @Tool({
        name: 'get_scan_history',
        description:
            'Past CogNerd analysis runs: status, dates, prompt volume, mentions, citations, and visibility score movement. Standalone tool.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('scan-history'))
    async getScanHistory(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getScanHistory(token);
        ctx.logger.info('Scan history', { runs: data.totalRuns });
        return data;
    }

    @Tool({
        name: 'get_ai_readiness_audit',
        description:
            'AEO / answer-readiness audit: crawl score, schema, chunk structure, entity clarity, and citation-surface findings. Standalone tool.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-readiness-audit'))
    async getAiReadinessAudit(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getAiReadinessAudit(token);
        ctx.logger.info('AI readiness audit', { score: data.score, grade: data.grade });
        return data;
    }

    @Tool({
        name: 'get_geo_assets',
        description:
            'GEO assets for the brand: llms.txt, schema, robots, entity graph, FAQ extract, and AI sitemap — plus publish status. Standalone tool.',
        inputSchema: BrandScopeSchema.extend({
            jobId: z.string().optional().describe('Job ID of the generated assets run (returned by generate_geo_assets)'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('geo-assets'))
    async getGeoAssets(args: { brandId?: string; jobId?: string }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const targetId = args.jobId || args.brandId;
        const data = await this.cognerd.getGeoAssets(targetId, token);
        ctx.logger.info('GEO assets', { total: data.totalAssets, published: data.published });
        return data;
    }

    @Tool({
        name: 'get_agxp',
        description:
            'AGXP (AI Growth Experience Platform) loop: Connect, Presence, Prompts, Gaps, Publish, and Lift scores for the brand. Standalone tool.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('agxp'))
    async getAgxp(_args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getAgxp(token);
        ctx.logger.info('AGXP', { loopScore: data.loopScore });
        return data;
    }

    @Tool({
        name: 'get_content_studio',
        description:
            'Content Studio briefs generated from visibility gaps: target prompt, outline, estimated citation lift, and production status. Standalone tool.',
        inputSchema: ContentStudioSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async getContentStudio(args: z.infer<typeof ContentStudioSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getContentStudio(args.status, token);
        ctx.logger.info('Content studio', { status: data.status, total: data.totalBriefs });
        return data;
    }

    // =========================================================================
    // Phase 1: AEO/GEO Remediation & Audience Intelligence Tools
    // =========================================================================

    @Tool({
        name: 'generate_geo_assets',
        description:
            'Generates live llms.txt, robots.txt, sitemap, and Schema.org files for the brand site to maximize AI engine citation readiness (consumes 1 daily GEO tool allowance).',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('geo-assets'))
    async generateGeoAssets(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.generateGeoAssetsLive(args.brandId, token);
        ctx.logger.info('Generate GEO assets', { jobId: data?.jobId, total: data?.totalAssets });
        return data;
    }

    @Tool({
        name: 'trigger_aeo_audit',
        description:
            'Initiates a live technical AEO (Answer Engine Optimization) site crawl and audit: entity clarity, schema, chunk structure, and citation surface ratings (consumes 1 daily AEO tool allowance).',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-readiness-audit'))
    async triggerAeoAudit(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.triggerAeoAuditLive(args.brandId, token);
        ctx.logger.info('Trigger AEO audit', { jobId: data?.jobId, score: data?.score });
        return data;
    }

    @Tool({
        name: 'get_latest_aeo_report',
        description:
            'Fetches technical AEO audit report, crawl findings, and recommendation breakdown by audit job_id or brand.',
        inputSchema: BrandScopeSchema.extend({
            jobId: z.string().optional().describe('Job ID of the AEO audit run (returned by trigger_aeo_audit)'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-readiness-audit'))
    async getLatestAeoReport(args: { brandId?: string; jobId?: string }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const targetId = args.jobId || args.brandId;
        const data = await this.cognerd.getLatestAeoReport(targetId, token);
        ctx.logger.info('Latest AEO report', { score: data?.score, grade: data?.grade });
        return data;
    }

    @Tool({
        name: 'get_technical_diagnostics',
        description:
            'Retrieves real-time site technical diagnostics: robot access rules, sitemap status, schema presence, and latency.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    async getTechnicalDiagnostics(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getTechnicalDiagnostics(args.brandId, token);
        ctx.logger.info('Technical diagnostics', { domain: data?.domain, status: data?.status });
        return data;
    }

    @Tool({
        name: 'generate_icp',
        description:
            'Auto-generates an Ideal Customer Profile (ICP) and buyer personas based on scraped website positioning (consumes 1 tools.llm_generation.daily allowance).',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('audience-personas'))
    async generateIcp(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.generateIcpLive(args.brandId, token);
        ctx.logger.info('Generate ICP', { personas: data?.personas?.length, status: data?.status });
        return data;
    }

    @Tool({
        name: 'suggest_personas',
        description:
            'Suggests buyer persona profiles from free-text company descriptions or industry context without needing an existing brand.',
        inputSchema: z.object({
            name: z.string().optional().describe('Brand or product name.'),
            description: z.string().optional().describe('Product or company description.'),
            industry: z.string().optional().describe('Target industry vertical.'),
            audience: z.string().optional().describe('Target customer demographic.'),
            location: z.string().optional().describe('Geographic location.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('audience-personas'))
    async suggestPersonas(
        args: { name?: string; description?: string; industry?: string; audience?: string; location?: string },
        ctx: ExecutionContext
    ) {
        const token = extractToken(ctx);
        const data = await this.cognerd.suggestPersonasLive(args, token);
        ctx.logger.info('Suggest personas', { total: data?.personas?.length || data?.totalSuggested });
        return data;
    }

    @Tool({
        name: 'manage_competitors',
        description:
            'Adds, removes, or lists tracked competitor domains for the active brand to monitor in AI answer share-of-voice benchmarks.',
        inputSchema: BrandScopeSchema.extend({
            action: z.enum(['add', 'remove', 'list']).default('list').describe('Action: add, remove, or list competitors.'),
            name: z.string().optional().describe('Competitor brand or company name.'),
            url: z.string().optional().describe('Competitor website domain or URL.'),
            aliases: z.array(z.string()).optional().describe('Alternate brand aliases.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('competitive-intelligence'))
    async manageCompetitors(
        args: { brandId?: string; action?: 'add' | 'remove' | 'list'; name?: string; url?: string; aliases?: string[] },
        ctx: ExecutionContext
    ) {
        const token = extractToken(ctx);
        const data = await this.cognerd.manageCompetitorLive(
            args.action || 'list',
            args.name && args.url ? { name: args.name, url: args.url, aliases: args.aliases } : undefined,
            args.brandId,
            token
        );
        ctx.logger.info('Manage competitors', { action: data?.action, total: data?.totalCompetitors });
        return data;
    }

    // =========================================================================
    // Phase 2: Content Studio & Multi-Channel Social Engine Tools
    // =========================================================================

    @Tool({
        name: 'generate_linkedin_carousel',
        description:
            'Generates a multi-slide LinkedIn carousel deck addressing a specific topic, buyer question, or competitive claim (consumes 1 tools.carousel.daily allowance).',
        inputSchema: BrandScopeSchema.extend({
            topic: z.string().describe('Topic or thesis of the carousel deck.'),
            targetAudience: z.string().optional().describe('Target customer demographic (e.g. CTOs, Growth Leads).'),
            slideCount: z.number().min(3).max(12).optional().default(6).describe('Number of slides (default: 6).'),
            theme: z.enum(['minimal', 'bold', 'dark', 'corporate']).optional().default('bold').describe('Visual theme.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async generateLinkedinCarousel(
        args: { brandId?: string; topic: string; targetAudience?: string; slideCount?: number; theme?: 'minimal' | 'bold' | 'dark' | 'corporate' },
        ctx: ExecutionContext
    ) {
        const token = extractToken(ctx);
        const data = await this.cognerd.generateCarouselLive(args, token);
        ctx.logger.info('Generate carousel', { id: data?.id, slides: data?.slideCount });
        return data;
    }

    @Tool({
        name: 'get_carousel_deck',
        description:
            'Retrieves full slide copy, layouts, and theme configuration for an existing carousel deck by ID.',
        inputSchema: z.object({
            deckId: z.string().describe('Carousel deck ID.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async getCarouselDeck(args: { deckId: string }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getCarouselDeckLive(args.deckId, token);
        ctx.logger.info('Get carousel deck', { id: data?.id, title: data?.title });
        return data;
    }

    @Tool({
        name: 'rerender_carousel',
        description:
            'Re-renders carousel slide designs after text or theme edits (free operation).',
        inputSchema: z.object({
            deckId: z.string().describe('Carousel deck ID to re-render.'),
            theme: z.enum(['minimal', 'bold', 'dark', 'corporate']).optional().describe('Updated visual theme.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async rerenderCarousel(args: { deckId: string; theme?: 'minimal' | 'bold' | 'dark' | 'corporate' }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.rerenderCarouselLive(args.deckId, { theme: args.theme }, token);
        ctx.logger.info('Rerender carousel', { id: data?.id, status: data?.status });
        return data;
    }

    @Tool({
        name: 'start_guided_article_wizard',
        description:
            'Initializes an AI-guided, research-grounded article project targeting a buyer prompt gap where competitors are cited (consumes 1 briefs.blog.monthly allowance).',
        inputSchema: BrandScopeSchema.extend({
            targetPrompt: z.string().describe('Buyer prompt or comparison query to target.'),
            title: z.string().optional().describe('Proposed article working title.'),
            persona: z.string().optional().describe('Target buyer persona.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async startGuidedArticleWizard(
        args: { brandId?: string; targetPrompt: string; title?: string; persona?: string },
        ctx: ExecutionContext
    ) {
        const token = extractToken(ctx);
        const data = await this.cognerd.startArticleWizardLive(args, token);
        ctx.logger.info('Start article wizard', { id: data?.id, status: data?.status });
        return data;
    }

    @Tool({
        name: 'run_article_wizard_step',
        description:
            'Executes a specific step of the guided article wizard: outline, research facts, draft copy, or firewall check.',
        inputSchema: z.object({
            projectId: z.string().describe('Article project ID.'),
            step: z.enum(['outline', 'research', 'draft', 'firewall']).describe('Wizard step to execute.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async runArticleWizardStep(args: { projectId: string; step: 'outline' | 'research' | 'draft' | 'firewall' }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.runArticleWizardStepLive(args.projectId, args.step, token);
        ctx.logger.info('Run wizard step', { projectId: data?.projectId, step: data?.stepCompleted });
        return data;
    }

    @Tool({
        name: 'finalize_article_to_blog',
        description:
            'Finalizes an article project and publishes it to the brand blog document library.',
        inputSchema: z.object({
            projectId: z.string().describe('Article project ID.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async finalizeArticleToBlog(args: { projectId: string }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.finalizeArticleToBlogLive(args.projectId, token);
        ctx.logger.info('Finalize article', { projectId: data?.projectId, status: data?.status });
        return data;
    }

    @Tool({
        name: 'repurpose_article_to_social',
        description:
            'Generates high-engagement LinkedIn posts and Twitter/X threads from an existing article or content project.',
        inputSchema: z.object({
            projectIdOrTopic: z.string().describe('Article project ID or topic string.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async repurposeArticleToSocial(args: { projectIdOrTopic: string }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.repurposeArticleLive(args.projectIdOrTopic, token);
        ctx.logger.info('Repurpose article', { topic: data?.topic, tweets: data?.twitter?.thread?.length });
        return data;
    }

    @Tool({
        name: 'rewrite_content_paragraph',
        description:
            'AI rewrites a text section or paragraph for maximum answer-engine citation grounding and clarity.',
        inputSchema: z.object({
            text: z.string().describe('Original paragraph text to rewrite.'),
            intent: z.string().optional().describe('Target search intent or focus.'),
            brandContext: z.string().optional().describe('Brand context or positioning guidelines.'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async rewriteContentParagraph(
        args: { text: string; intent?: string; brandContext?: string },
        ctx: ExecutionContext
    ) {
        const token = extractToken(ctx);
        const data = await this.cognerd.rewriteParagraphLive(args, token);
        ctx.logger.info('Rewrite paragraph', { lift: data?.estimatedCitationLift });
        return data;
    }

    @Tool({
        name: 'generate_standalone_social',
        description:
            'Generates standalone social post copy (LinkedIn/X) on a given topic without creating a full project.',
        inputSchema: z.object({
            topic: z.string().describe('Topic or thesis for the post.'),
            platform: z.enum(['linkedin', 'twitter', 'both']).optional().default('both').describe('Target social platform.'),
            tone: z.string().optional().describe('Voice/tone (e.g. thought-leader, conversational).'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('content-studio'))
    async generateStandaloneSocial(
        args: { topic: string; platform?: 'linkedin' | 'twitter' | 'both'; tone?: string },
        ctx: ExecutionContext
    ) {
        const token = extractToken(ctx);
        const data = await this.cognerd.generateStandaloneSocialLive(args, token);
        ctx.logger.info('Standalone social', { topic: data?.topic, platform: data?.platform });
        return data;
    }

    // =========================================================================
    // Phase 3: Deep Telemetry, Backlinks & Live Integrations Tools
    // =========================================================================

    @Tool({
        name: 'get_backlinks_snapshot',
        description:
            'Retrieves DataForSEO backlink profile, referring domains, domain rank, and competitor backlink comparisons for the brand.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('competitive-intelligence'))
    async getBacklinksSnapshot(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getBacklinksSnapshotLive(args.brandId, token);
        ctx.logger.info('Get backlinks snapshot', { domain: data.brandDomain, backlinks: data.totalBacklinks });
        return data;
    }

    @Tool({
        name: 'refresh_competitor_backlinks',
        description:
            'Triggers a live DataForSEO backlink refresh crawl for the brand and tracked competitors.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('competitive-intelligence'))
    async refreshCompetitorBacklinks(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.refreshCompetitorBacklinksLive(args.brandId, token);
        ctx.logger.info('Refresh backlinks', { status: (data as any)?.status });
        return data;
    }

    @Tool({
        name: 'get_search_console_report',
        description:
            'Pulls live Google Search Console telemetry: organic clicks, impressions, CTR, and ranking queries for the brand domain.',
        inputSchema: BrandScopeSchema.extend({
            days: z.number().min(7).max(90).optional().default(30).describe('Time window in days (default: 30).'),
        }),
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    async getSearchConsoleReport(args: { brandId?: string; days?: number }, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getSearchConsoleReportLive(args.days, args.brandId, token);
        ctx.logger.info('Search Console report', { clicks: data.totalClicks, impressions: data.totalImpressions });
        return data;
    }

    @Tool({
        name: 'list_search_console_sites',
        description:
            'Lists verified Google Search Console site properties connected to the workspace.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    async listSearchConsoleSites(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.listSearchConsoleSitesLive(args.brandId, token);
        ctx.logger.info('List GSC sites', { total: Array.isArray(data) ? data.length : 1 });
        return data;
    }

    @Tool({
        name: 'get_ga4_traffic_report',
        description:
            'Retrieves Google Analytics 4 traffic channels, session lengths, user engagement, and AI assistant referral shares.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    async getGa4TrafficReport(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getGa4TrafficReportLive(args.brandId, token);
        ctx.logger.info('GA4 report', { users: data.totalUsers, sessions: data.sessions });
        return data;
    }

    @Tool({
        name: 'get_clarity_heatmaps',
        description:
            'Retrieves Microsoft Clarity user experience telemetry: scroll depth, rage clicks, dead clicks, and quick backs.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    async getClarityHeatmaps(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getClarityReportLive(args.brandId, token);
        ctx.logger.info('Clarity report', { sessions: data.totalSessions, scrollDepth: data.scrollDepthPercent });
        return data;
    }

    @Tool({
        name: 'get_google_ads_report',
        description:
            'Retrieves paid search campaign performance, impressions, ad spend, and conversion cost metrics.',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    async getGoogleAdsReport(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getGoogleAdsReportLive(args.brandId, token);
        ctx.logger.info('Google Ads report', { spend: data.totalSpend, conversions: data.conversions });
        return data;
    }

    @Tool({
        name: 'get_integrations_status',
        description:
            'Checks connection and authentication status for all third-party toolkits (GSC, GA4, Clarity, LinkedIn, Slack, WordPress).',
        inputSchema: BrandScopeSchema,
    })
    @UseGuards(OAuthGuard)
    @Widget(cognerdWidget('ai-insights'))
    async getIntegrationsStatus(args: z.infer<typeof BrandScopeSchema>, ctx: ExecutionContext) {
        const token = extractToken(ctx);
        const data = await this.cognerd.getIntegrationsStatusLive(args.brandId, token);
        ctx.logger.info('Integrations status', { connected: data.connectedCount, total: data.totalToolkits });
        return data;
    }
}
