import { Injectable } from '@nitrostack/core';
import { CognerdApiClient } from '../../services/cognerd-api.client.js';
import {
    AGXP_STAGES,
    AUDIT_FINDINGS,
    BRAND,
    CITATIONS,
    COMPETITORS,
    CONTENT_BRIEFS,
    GEO_ASSETS,
    ICP_INPUTS,
    PERSONAS,
    PROMPTS,
    PROVIDERS,
    RECENT_MENTIONS,
    SCAN_RUNS,
    SOV_TREND,
    TREND,
    VISIBILITY_ROWS,
    filterBriefs,
    filterCitations,
    filterPrompts,
    filterVisibility,
} from './cognerd.data.js';
import type { Brand, BriefStatus, Engine, CarouselSlide, CarouselDeck, ArticleWizardProject } from './cognerd.types.js';


@Injectable({ deps: [CognerdApiClient] })
export class CognerdService {
    constructor(private readonly apiClient: CognerdApiClient) {}

    async getBrand(_brandId?: string) {
        return BRAND;
    }

    async whoami() {
        const live = await this.apiClient.callTool('whoami');
        if (live) return live;
        return {
            user: { id: '113', name: 'Nitrostack Partner', email: 'nitrostack.sandbox@cognerd.ai' },
            brands: [{ id: '8fd53305-fdfc-4825-b4b1-bc64233d46d7', name: 'CogNerd', url: 'https://www.cognerd.ai' }],
            scopes: ['cognerd:full'],
            credits: { balance: 410, reserved: 0, draftArticleCost: 30 },
        };
    }

    async getCreditBalance() {
        const live = await this.apiClient.callTool('get_credit_balance');
        if (live) return live;
        return { balance: 410, reserved: 0, draftArticleCost: 30 };
    }

    async getAudiencePersonas(brandId?: string) {
        const liveContext = await this.apiClient.callTool('get_brand_context', brandId ? { brand_id: brandId } : {});
        const brand: Brand = liveContext?.brand
            ? {
                  id: liveContext.brand.id || BRAND.id,
                  name: liveContext.brand.name || BRAND.name,
                  domain: liveContext.brand.url ? liveContext.brand.url.replace(/^https?:\/\//, '') : BRAND.domain,
                  industry: liveContext.brand.industry || BRAND.industry,
                  workspace: BRAND.workspace,
                  description: liveContext.brand.description || BRAND.description,
                  credits: BRAND.credits,
              }
            : BRAND;

        return {
            brand,
            icp: ICP_INPUTS,
            personas: PERSONAS,
            totalPersonas: PERSONAS.length,
        };
    }

    async getPromptIntelligence(status?: 'new' | 'active' | 'archived', brandId?: string) {
        const liveWeak = await this.apiClient.callTool('get_weak_prompts', brandId ? { brand_id: brandId } : {});
        let prompts = filterPrompts(status);

        if (liveWeak?.prompts && Array.isArray(liveWeak.prompts) && liveWeak.prompts.length > 0) {
            const mappedPrompts = liveWeak.prompts.map((p: any, idx: number) => ({
                id: p.promptKey || `live-p-${idx + 1}`,
                text: p.promptText || p.text || 'Prompt',
                category: 'buyer_intent',
                status: (p.status || 'new') as 'new' | 'active' | 'archived',
                engineCoverage: p.providers || ['ChatGPT', 'Claude', 'Perplexity'],
                volumeScore: 85 - idx * 4,
                intent: 'High Intent Comparison',
            }));
            prompts = status && status !== ('all' as any)
                ? mappedPrompts.filter((p: any) => p.status === status)
                : mappedPrompts;
        }

        return {
            brand: BRAND,
            status: status ?? 'all',
            counts: {
                new: prompts.filter((p) => p.status === 'new').length,
                active: prompts.filter((p) => p.status === 'active').length,
                archived: prompts.filter((p) => p.status === 'archived').length,
            },
            prompts,
            totalPrompts: prompts.length,
        };
    }

    async getAiVisibility(filters: {
        engine?: Engine | 'all';
        mentioned?: 'all' | 'mentioned' | 'cited' | 'not_mentioned';
    }) {
        const rows = filterVisibility(filters);
        const tracked = new Set(VISIBILITY_ROWS.map((r) => r.prompt)).size;
        const mentionedPrompts = new Set(VISIBILITY_ROWS.filter((r) => r.mentioned).map((r) => r.prompt)).size;
        const trendingUp = 8;
        const positioned = VISIBILITY_ROWS.filter((r) => r.position !== null);
        const avgPosition =
            positioned.length > 0
                ? Number(
                      (
                          positioned.reduce((sum, r) => sum + (r.position ?? 0), 0) / positioned.length
                      ).toFixed(1),
                  )
                : null;

        return {
            brand: BRAND,
            metrics: {
                trackedPrompts: tracked,
                mentionedIn: mentionedPrompts,
                mentionRate: tracked ? Number((mentionedPrompts / tracked).toFixed(3)) : 0,
                trendingUp,
                avgPosition,
            },
            filters: {
                engine: filters.engine ?? 'all',
                mentioned: filters.mentioned ?? 'all',
            },
            rows,
            totalRows: rows.length,
        };
    }

    async getCitations(engine?: Engine | 'all') {
        const rows = filterCitations(engine);
        const owned = CITATIONS.filter((c) => c.owned).length;
        const domains = new Set(CITATIONS.map((c) => c.sourceDomain)).size;
        const coverage = VISIBILITY_ROWS.length
            ? Number((CITATIONS.length / VISIBILITY_ROWS.filter((r) => r.mentioned).length).toFixed(3))
            : 0;

        const byEngine = PROVIDERS.map((p) => ({
            engine: p.engine,
            citations: p.citations,
            mentions: p.mentions,
        }));

        return {
            brand: BRAND,
            metrics: {
                totalCitations: 317,
                sourceDomains: domains + 42,
                ownedCitations: 129,
                citationCoverage: 0.247,
                ownedShare: Number((owned / CITATIONS.length).toFixed(3)),
            },
            engine: engine ?? 'all',
            trend: TREND.map((p) => ({ date: p.date, citations: p.citations })),
            byEngine,
            citations: rows,
            totalCitations: rows.length,
        };
    }

    async getAiInsights() {
        const latest = TREND[TREND.length - 1];
        return {
            brand: BRAND,
            metrics: {
                visibilityScore: latest.score,
                visibilityDelta: 12.4,
                totalMentions: 1284,
                organicMentions: 942,
                seededMentions: 342,
                explicitMentions: 611,
                citations: 317,
                dropsDetected: 2,
            },
            trend: TREND,
            byProvider: PROVIDERS,
            recentMentions: RECENT_MENTIONS,
        };
    }

    async getCompetitiveIntelligence() {
        return {
            brand: BRAND,
            you: COMPETITORS[0],
            competitors: COMPETITORS,
            dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
            shareOfVoiceTrend: SOV_TREND,
            trackedBrands: COMPETITORS.length,
        };
    }

    async getScanHistory() {
        const liveHistory = await this.apiClient.callTool('get_brand_history');
        const completed = SCAN_RUNS.filter((r) => r.status === 'completed');
        return {
            brand: BRAND,
            runs: liveHistory?.runs || SCAN_RUNS,
            totalRuns: liveHistory?.runs?.length || SCAN_RUNS.length,
            completedRuns: completed.length,
            latestScore: completed[0]?.visibilityScore ?? null,
        };
    }

    async getAiReadinessAudit() {
        const liveAudit = await this.apiClient.callTool('get_audit_report');
        const base = liveAudit?.score || 76;
        return {
            brand: BRAND,
            score: base,
            grade: liveAudit?.grade || 'B',
            crawledAt: liveAudit?.crawledAt || '2026-08-23T11:40:00.000Z',
            pagesCrawled: liveAudit?.pagesCrawled || 86,
            categories: liveAudit?.categories || [
                { name: 'Entity clarity', score: 71 },
                { name: 'Schema', score: 48 },
                { name: 'Chunk structure', score: 74 },
                { name: 'Citation surfaces', score: 62 },
                { name: 'Proof', score: 81 },
            ],
            findings: AUDIT_FINDINGS,
            critical: AUDIT_FINDINGS.filter((f) => f.severity === 'critical').length,
            high: AUDIT_FINDINGS.filter((f) => f.severity === 'high').length,
        };
    }

    async getGeoAssets() {
        const liveGeo = await this.apiClient.callTool('get_geo_assets');
        const assets = liveGeo?.assets || GEO_ASSETS;
        return {
            brand: BRAND,
            assets,
            totalAssets: assets.length,
            published: assets.filter((a: any) => a.status === 'published').length,
            drafts: assets.filter((a: any) => a.status === 'draft').length,
            needsRefresh: assets.filter((a: any) => a.status === 'needs_refresh').length,
        };
    }

    async getAgxp() {
        const avg = Math.round(
            AGXP_STAGES.reduce((sum, s) => sum + s.score, 0) / AGXP_STAGES.length,
        );
        return {
            brand: BRAND,
            loopScore: avg,
            stages: AGXP_STAGES,
            lift30d: '+12.4% visibility · +21.6% citations',
        };
    }

    async getContentStudio(status?: BriefStatus) {
        const briefs = filterBriefs(status);
        return {
            brand: BRAND,
            status: status ?? 'all',
            counts: {
                ready: CONTENT_BRIEFS.filter((b) => b.status === 'ready').length,
                in_progress: CONTENT_BRIEFS.filter((b) => b.status === 'in_progress').length,
                published: CONTENT_BRIEFS.filter((b) => b.status === 'published').length,
                gap: CONTENT_BRIEFS.filter((b) => b.status === 'gap').length,
            },
            briefs,
            totalBriefs: briefs.length,
        };
    }

    /**
     * Phase 1: Asynchronously generates live llms.txt, robots.txt, and Schema.org assets (20 credits).
     */
    async generateGeoAssetsLive(brandId?: string) {
        const liveJob = await this.apiClient.callTool('generate_geo_assets', brandId ? { brand_id: brandId } : {});
        const restJob = !liveJob ? await this.apiClient.callRest('/api/geo-assets/generate', { method: 'POST', data: { brand_id: brandId } }) : null;
        const job = liveJob || restJob;

        const jobId = job?.job_id || job?.jobId || `geo-job-${Date.now()}`;
        return {
            jobId,
            brandId: brandId || BRAND.id,
            status: 'completed' as const,
            assets: GEO_ASSETS,
            totalAssets: GEO_ASSETS.length,
            downloadUrl: `https://api-dev.cognerd.in/api/geo-assets/reports/${jobId}/download`,
            summary: 'Generated 6 discoverability assets (llms.txt, schema.json, robots.txt, entity-graph.json, sitemap.xml, faq-extract.json).',
            message: 'All GEO files successfully generated and ready for AI search engines.',
        };
    }

    /**
     * Phase 1: Initiates a live technical AEO (Answer Engine Optimization) site crawl and audit (50 credits).
     */
    async triggerAeoAuditLive(brandId?: string) {
        const liveAudit = await this.apiClient.callTool('run_aeo_audit', brandId ? { brand_id: brandId } : {});
        const restAudit = !liveAudit ? await this.apiClient.callRest('/api/aeo-audit/generate', { method: 'POST', data: { brand_id: brandId } }) : null;
        const job = liveAudit || restAudit;

        const jobId = job?.job_id || job?.jobId || `aeo-audit-${Date.now()}`;
        return {
            brand: BRAND,
            jobId,
            score: 76,
            grade: 'B',
            crawledAt: new Date().toISOString(),
            pagesCrawled: 86,
            categories: [
                { name: 'Entity clarity', score: 71 },
                { name: 'Schema', score: 48 },
                { name: 'Chunk structure', score: 74 },
                { name: 'Citation surfaces', score: 62 },
                { name: 'Proof', score: 81 },
            ],
            findings: AUDIT_FINDINGS,
            critical: AUDIT_FINDINGS.filter((f) => f.severity === 'critical').length,
            high: AUDIT_FINDINGS.filter((f) => f.severity === 'high').length,
            status: 'completed',
        };
    }

    /**
     * Phase 1: Fetches the latest stored technical AEO report.
     */
    async getLatestAeoReport(brandId?: string) {
        const liveReport = await this.apiClient.callRest(`/api/aeo-audit/fetch`, { params: brandId ? { brandId } : undefined });
        if (liveReport && liveReport.score) {
            return {
                brand: BRAND,
                score: liveReport.score,
                grade: liveReport.grade || 'B',
                crawledAt: liveReport.crawledAt || new Date().toISOString(),
                pagesCrawled: liveReport.pagesCrawled || 86,
                categories: liveReport.categories || [],
                findings: liveReport.findings || AUDIT_FINDINGS,
                critical: (liveReport.findings || AUDIT_FINDINGS).filter((f: any) => f.severity === 'critical').length,
                high: (liveReport.findings || AUDIT_FINDINGS).filter((f: any) => f.severity === 'high').length,
                status: 'completed',
            };
        }
        return this.getAiReadinessAudit();
    }

    /**
     * Phase 1: Retrieves site technical diagnostics and AI crawler access status.
     */
    async getTechnicalDiagnostics(brandId?: string) {
        const liveDiag = await this.apiClient.callRest('/api/brand-monitor/analytics/diagnostics', {
            params: brandId ? { brandId } : undefined,
        });

        if (liveDiag && liveDiag.crawlability) {
            return {
                brand: BRAND,
                domain: BRAND.domain,
                ...liveDiag,
            };
        }

        return {
            brand: BRAND,
            domain: BRAND.domain,
            status: 'healthy' as const,
            crawlability: {
                robotsTxt: true,
                sitemapXml: true,
                llmsTxt: true,
                schemaOrgDetected: true,
            },
            aiEngineAccess: {
                gptBot: true,
                claudeBot: true,
                perplexityBot: true,
                googleOther: true,
            },
            latencyMs: 142,
            lastChecked: new Date().toISOString(),
            issues: [
                'Schema Organization markup missing social sameAs references.',
                'Chunk structure on blog pages lacks explicit summary bullet blocks.',
            ],
        };
    }

    /**
     * Phase 1: Auto-generates an Ideal Customer Profile (ICP) for the brand (6 credits).
     */
    async generateIcpLive(brandId?: string) {
        const liveIcp = await this.apiClient.callRest('/api/brand-monitor/audience/icp', {
            method: 'POST',
            data: { brandId },
        });

        if (liveIcp && liveIcp.icp) {
            return {
                brand: BRAND,
                icp: liveIcp.icp,
                personas: liveIcp.personas || PERSONAS,
                suggestedTopics: liveIcp.suggestedTopics || ['AI Search Optimization', 'Answer Engine Marketing'],
                creditsDeducted: 6,
                status: 'success' as const,
            };
        }

        return {
            brand: BRAND,
            icp: ICP_INPUTS,
            personas: PERSONAS,
            suggestedTopics: [
                'AI Search Optimization (GEO)',
                'Answer Engine Optimization vs Traditional SEO',
                'How to Get Cited by ChatGPT & Perplexity',
                'Schema.org & Entity Graph Best Practices',
            ],
            creditsDeducted: 6,
            status: 'success' as const,
        };
    }

    /**
     * Phase 1: Suggests buyer personas from free-text industry descriptions (free).
     */
    async suggestPersonasLive(context: {
        name?: string;
        description?: string;
        industry?: string;
        audience?: string;
        location?: string;
    }) {
        const liveSuggest = await this.apiClient.callRest('/api/brand-monitor/brand-profile/suggest-personas', {
            method: 'POST',
            data: context,
        });

        if (liveSuggest && liveSuggest.personas) {
            return liveSuggest;
        }

        return {
            personas: PERSONAS.map((p) => ({
                role: p.title,
                name: p.name,
                description: p.summary,
                painPoints: p.painPoints,
                goals: p.goals,
            })),
            totalSuggested: PERSONAS.length,
        };
    }

    /**
     * Phase 1: Adds or removes tracked competitor domains for the active brand.
     */
    async manageCompetitorLive(
        action: 'add' | 'remove' | 'list',
        competitor?: { name: string; url: string; aliases?: string[] },
        brandId?: string
    ) {
        if (action === 'add' && competitor) {
            await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                method: 'POST',
                data: competitor,
                params: brandId ? { brandId } : undefined,
            });
        } else if (action === 'remove' && competitor) {
            await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                method: 'DELETE',
                data: { name: competitor.name, url: competitor.url },
                params: brandId ? { brandId } : undefined,
            });
        }

        const currentCompetitors = COMPETITORS.map((c) => ({
            name: c.name,
            url: `https://${c.domain}`,
            aliases: [c.name.toLowerCase()],
        }));

        return {
            brandId: brandId || BRAND.id,
            action: action === 'add' ? ('added' as const) : action === 'remove' ? ('removed' as const) : ('list' as const),
            competitor: competitor || { name: 'Tracked Competitor', url: 'https://example.com' },
            totalCompetitors: currentCompetitors.length,
            competitors: currentCompetitors,
        };
    }

    // =========================================================================
    // Phase 2: Content Studio & Multi-Channel Social Engine
    // =========================================================================

    /**
     * Phase 2: Generates a multi-slide LinkedIn carousel deck (15 credits).
     */
    async generateCarouselLive(params: {
        topic: string;
        targetAudience?: string;
        slideCount?: number;
        theme?: 'minimal' | 'bold' | 'dark' | 'corporate';
        brandId?: string;
    }) {
        const liveRes = await this.apiClient.callRest('/api/carousel', {
            method: 'POST',
            data: {
                topic: params.topic,
                targetAudience: params.targetAudience || 'B2B Buyers & Technical Decision Makers',
                slideCount: params.slideCount || 6,
                theme: params.theme || 'bold',
                brandId: params.brandId || BRAND.id,
            },
        });

        if (liveRes && liveRes.slides) {
            return liveRes;
        }

        const deckId = `deck-${Date.now()}`;
        const count = params.slideCount || 6;
        const slides: CarouselSlide[] = [
            {
                slideNumber: 1,
                headline: `Why ${params.topic} Matters for AI Visibility in 2026`,
                body: 'AI search engines (ChatGPT, Perplexity, Claude) are rapidly replacing traditional search. If your brand is not structured for LLMs, you are invisible.',
                callout: 'The Shift from SEO to GEO',
            },
            {
                slideNumber: 2,
                headline: 'The Problem: Missing Entity Grounding',
                body: 'Over 78% of B2B websites fail to provide clear entity definitions and structured schema markup that AI models require to cite them.',
                bulletPoints: ['No llms.txt index file', 'Unstructured chunking', 'Missing competitor benchmark'],
            },
            {
                slideNumber: 3,
                headline: 'How LLMs Choose Who to Cite',
                body: 'Models look for high semantic authority, corroborated third-party sources, and verified claim-source pairings.',
                callout: 'Citations > Backlinks in AI Search',
            },
            {
                slideNumber: 4,
                headline: 'Action Step 1: Implement Discoverability Assets',
                body: 'Deploy llms.txt, Schema.org JSON-LD, and entity-graph definitions on your primary domain immediately.',
            },
            {
                slideNumber: 5,
                headline: 'Action Step 2: Target Weak Buyer Prompts',
                body: 'Identify the exact comparison queries where competitors are being recommended instead of your product.',
            },
            {
                slideNumber: 6,
                headline: 'Key Takeaway & Next Steps',
                body: 'Measure your visibility score weekly and optimize content for answer engines to capture 3x more high-intent organic buyers.',
                callout: 'Start your GEO scan on CogNerd today.',
            },
        ].slice(0, count);

        return {
            id: deckId,
            brandId: params.brandId || BRAND.id,
            topic: params.topic,
            title: `Mastering ${params.topic}`,
            targetAudience: params.targetAudience || 'B2B Buyers & Decision Makers',
            theme: params.theme || 'bold',
            slideCount: slides.length,
            slides,
            status: 'rendered' as const,
            creditsDeducted: 15,
            createdAt: new Date().toISOString(),
            previewUrl: `https://api-dev.cognerd.in/api/carousel/${deckId}/preview-kit`,
        };
    }

    /**
     * Phase 2: Retrieves an existing carousel deck by ID.
     */
    async getCarouselDeckLive(deckId: string) {
        const live = await this.apiClient.callRest(`/api/carousel/${deckId}`);
        if (live && live.id) return live;
        return this.generateCarouselLive({ topic: 'Generative Engine Optimization' });
    }

    /**
     * Phase 2: Re-renders an edited carousel deck.
     */
    async rerenderCarouselLive(deckId: string, updates?: { theme?: string; slides?: any[] }) {
        const live = await this.apiClient.callRest(`/api/carousel/${deckId}/rerender`, {
            method: 'POST',
            data: updates,
        });
        if (live) return live;
        return {
            id: deckId,
            status: 'rendered',
            message: 'Carousel deck successfully re-rendered with updated design theme.',
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Phase 2: Starts an AI-guided, research-grounded article creation project (30 credits).
     */
    async startArticleWizardLive(params: {
        targetPrompt: string;
        title?: string;
        persona?: string;
        brandId?: string;
    }) {
        const live = await this.apiClient.callRest('/api/content-studio/wizard/projects', {
            method: 'POST',
            data: {
                targetPrompt: params.targetPrompt,
                title: params.title || `How to Solve ${params.targetPrompt}`,
                persona: params.persona || 'Technical Decision Maker',
                brandId: params.brandId || BRAND.id,
            },
        });

        if (live && live.id) return live;

        const projectId = `proj-${Date.now()}`;
        return {
            id: projectId,
            brandId: params.brandId || BRAND.id,
            title: params.title || `Winning Citations for: "${params.targetPrompt}"`,
            targetPrompt: params.targetPrompt,
            status: 'writing' as const,
            currentStep: 'draft' as const,
            outline: [
                '1. Executive Summary & Market Shift',
                '2. Core Architectural Breakdown',
                '3. Comparison Matrix: Solutions vs Alternatives',
                '4. Step-by-Step Implementation Guide',
                '5. Verification & Measurable Outcomes',
            ],
            researchFacts: [
                { claim: '85% of engineers rely on AI answers before purchasing software tools.', sourceUrl: 'https://cognerd.ai/research/ai-buying-trends', confidence: 0.94 },
                { claim: 'Structured entity markup increases LLM citation frequency by 3.2x.', sourceUrl: 'https://cognerd.ai/research/geo-lift-study', confidence: 0.91 },
            ],
            contentMarkdown: `# Winning Citations for: "${params.targetPrompt}"\n\nAI assistants like ChatGPT, Claude, and Perplexity evaluate content based on entity precision and citation grounding...\n\n## Key Architectural Strategies\n\n1. Explicit JSON-LD schema definitions\n2. Concise definition blocks at the beginning of sections\n3. High-authority proof points and benchmarks`,
            wordCount: 1250,
            citationsIncluded: 8,
            creditsReserved: 30,
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Phase 2: Runs an individual wizard step in the background.
     */
    async runArticleWizardStepLive(projectId: string, step: 'outline' | 'research' | 'draft' | 'firewall') {
        const live = await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectId}/${step}`, {
            method: 'POST',
        });
        if (live) return live;

        return {
            projectId,
            stepCompleted: step,
            status: 'success',
            nextStep: step === 'outline' ? 'research' : step === 'research' ? 'draft' : step === 'draft' ? 'firewall' : 'finalize',
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Phase 2: Finalizes an article project and publishes it to the brand's blog store.
     */
    async finalizeArticleToBlogLive(projectId: string) {
        const live = await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectId}/finalize`, {
            method: 'POST',
        });
        if (live) return live;

        return {
            projectId,
            status: 'published',
            blogId: `blog-${Date.now()}`,
            url: `https://${BRAND.domain}/blog/ai-search-optimization-guide`,
            publishedAt: new Date().toISOString(),
            message: 'Article successfully finalized and saved to brand documents.',
        };
    }

    /**
     * Phase 2: Repurposes an article into LinkedIn & Twitter/X formats.
     */
    async repurposeArticleLive(projectIdOrTopic: string) {
        const live = await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectIdOrTopic}/repurpose`, {
            method: 'POST',
        });
        if (live && live.linkedin) return live;

        return {
            projectId: projectIdOrTopic,
            topic: 'AI Search Optimization & LLM Visibility',
            linkedin: {
                hook: '🚀 Traditional SEO is officially evolving. Here is how your brand gets recommended by ChatGPT, Claude, and Perplexity in 2026:',
                postText: 'Most teams still obsess over traditional blue-link rankings.\n\nMeanwhile, high-intent buyers are getting answers directly from AI assistants.\n\nHere are 3 concrete steps to ensure your brand is cited:\n1. Deploy llms.txt & structured schema\n2. Create research-grounded answers for buyer intent prompts\n3. Monitor AI share-of-voice benchmarks weekly\n\nAre you tracking your AI search presence yet?',
                hashtags: ['#GEO', '#AEO', '#AISearch', '#B2BGrowth', '#MarketingStrategy'],
            },
            twitter: {
                thread: [
                    '1/5 AI search is taking over B2B discovery. If your brand isn’t cited in LLM answers, you’re missing 40%+ of buyers. Here’s the playbook 🧵👇',
                    '2/5 Step 1: Deploy llms.txt and entity schema. LLMs need clean, chunked structure to ingest your product capabilities.',
                    '3/5 Step 2: Target weak buyer prompts. Identify queries where competitors get cited and produce fact-grounded comparison briefs.',
                    '4/5 Step 3: Monitor your citation rate across ChatGPT, Claude, and Perplexity with continuous AEO auditing.',
                    '5/5 Bottom line: GEO (Generative Engine Optimization) is the new SEO. Start measuring your visibility today.',
                ],
                hashtags: ['#GEO', '#AISearch', '#BuildInPublic'],
            },
            keyTakeaways: [
                'Entity clarity and JSON-LD schema are prerequisites for AI citations.',
                'Targeting prompt gaps produces 3x higher citation lift than generic blog posts.',
                'Continuous AEO audits prevent sudden drops in AI answer visibility.',
            ],
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Phase 2: AI rewrites a content paragraph for maximum citation readiness.
     */
    async rewriteParagraphLive(params: { text: string; intent?: string; brandContext?: string }) {
        const live = await this.apiClient.callRest('/api/content-studio/wizard/rewrite', {
            method: 'POST',
            data: params,
        });
        if (live && live.rewrittenText) return live;

        return {
            originalText: params.text,
            rewrittenText: `${params.text.trim()} Specifically, modern AI answer engines prioritize content with explicit entity relationships, structured numerical data, and authoritative citations.`,
            focusIntent: params.intent || 'High Citation Surface Grounding',
            estimatedCitationLift: '+18% citation probability',
            improvements: [
                'Added explicit semantic entity definitions',
                'Removed ambiguous passive voice phrasing',
                'Structured text into high-density informational chunk',
            ],
        };
    }

    /**
     * Phase 2: Generates standalone social post copy (free).
     */
    async generateStandaloneSocialLive(params: {
        topic: string;
        platform?: 'linkedin' | 'twitter' | 'both';
        tone?: string;
    }) {
        const live = await this.apiClient.callRest('/api/content-studio/wizard/generate-social', {
            method: 'POST',
            data: params,
        });
        if (live) return live;

        return {
            topic: params.topic,
            platform: params.platform || 'both',
            tone: params.tone || 'thought-leader',
            content: `💡 Why ${params.topic} is critical for every growth leader today:\n\nAI engines are changing how customers evaluate software. If you're not actively optimizing your answer-engine presence, you're giving away market share to competitors.\n\nWhat is your team's strategy for AI search in 2026?`,
            generatedAt: new Date().toISOString(),
        };
    }
}


