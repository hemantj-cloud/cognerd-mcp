import { Injectable } from '@nitrostack/core';
import { CognerdApiClient } from '../../services/cognerd-api.client.js';
import type {
    Brand,
    BriefStatus,
    Engine,
    CarouselDeck,
    BacklinkSummary,
    SearchConsoleReport,
    Ga4TrafficReport,
    ClarityReport,
    GoogleAdsReport,
    IntegrationsStatus,
} from './cognerd.types.js';

@Injectable({ deps: [CognerdApiClient] })
export class CognerdService {
    constructor(private readonly apiClient: CognerdApiClient) {}

    async getBrand(brandId?: string, token?: string): Promise<Brand> {
        const liveContext = await this.apiClient.callTool('get_brand_context', brandId ? { brand_id: brandId } : {}, token);
        if (liveContext?.brand) {
            return liveContext.brand;
        }
        throw new Error('Failed to retrieve brand profile from CogNerd upstream.');
    }

    async whoami(token?: string) {
        const live = await this.apiClient.callTool('whoami', {}, token);
        if (live && typeof live === 'object') {
            return live;
        }
        throw new Error('Failed to retrieve user profile from CogNerd upstream.');
    }

    async getCreditBalance(token?: string) {
        const live = await this.apiClient.callTool('get_credit_balance', {}, token);
        if (live && typeof live === 'object') {
            return live;
        }
        throw new Error('Failed to retrieve credit balance from CogNerd upstream.');
    }

    async getAudiencePersonas(brandId?: string, token?: string) {
        const liveContext = await this.apiClient.callTool('get_brand_context', brandId ? { brand_id: brandId } : {}, token);
        return {
            brand: liveContext?.brand || null,
            icp: liveContext?.icp || null,
            personas: liveContext?.personas || [],
            totalPersonas: (liveContext?.personas || []).length,
        };
    }

    async getPromptIntelligence(status?: 'new' | 'active' | 'archived', brandId?: string, token?: string) {
        const liveWeak = await this.apiClient.callTool('get_weak_prompts', brandId ? { brand_id: brandId } : {}, token);
        const rawPrompts = Array.isArray(liveWeak?.prompts) ? liveWeak.prompts : [];
        const mappedPrompts = rawPrompts.map((p: any, idx: number) => ({
            id: p.promptKey || p.id || `prompt-${idx + 1}`,
            text: p.promptText || p.text || 'Prompt',
            category: p.category || 'buyer_intent',
            status: (p.status || 'new') as 'new' | 'active' | 'archived',
            engineCoverage: p.providers || p.engineCoverage || ['ChatGPT', 'Claude', 'Perplexity'],
            volumeScore: p.volumeScore || Math.max(10, 85 - idx * 4),
            intent: p.intent || 'High Intent Comparison',
        }));

        const filtered = status && status !== ('all' as any)
            ? mappedPrompts.filter((p: any) => p.status === status)
            : mappedPrompts;

        return {
            brand: liveWeak?.brand || null,
            status: status ?? 'all',
            counts: {
                new: mappedPrompts.filter((p: any) => p.status === 'new').length,
                active: mappedPrompts.filter((p: any) => p.status === 'active').length,
                archived: mappedPrompts.filter((p: any) => p.status === 'archived').length,
            },
            prompts: filtered,
            totalPrompts: filtered.length,
        };
    }

    async getAiVisibility(filters: {
        engine?: Engine | 'all';
        mentioned?: 'all' | 'mentioned' | 'cited' | 'not_mentioned';
    }, token?: string) {
        const live = await this.apiClient.callRest('/api/brand-monitor/analytics/visibility', {
            params: filters,
            bearerToken: token,
        }).catch(() => null);

        return live || {
            brand: null,
            metrics: {
                trackedPrompts: 0,
                mentionedIn: 0,
                mentionRate: 0,
                trendingUp: 0,
                avgPosition: null,
            },
            filters: {
                engine: filters.engine ?? 'all',
                mentioned: filters.mentioned ?? 'all',
            },
            rows: [],
            totalRows: 0,
        };
    }

    async getCitations(engine?: Engine | 'all', token?: string) {
        const live = await this.apiClient.callRest('/api/brand-monitor/analytics/citations', {
            params: { engine },
            bearerToken: token,
        }).catch(() => null);

        return live || {
            brand: null,
            metrics: {
                totalCitations: 0,
                sourceDomains: 0,
                ownedCitations: 0,
                citationCoverage: 0,
                ownedShare: 0,
            },
            engine: engine ?? 'all',
            trend: [],
            byEngine: [],
            citations: [],
            totalCitations: 0,
        };
    }

    async getAiInsights(token?: string) {
        const live = await this.apiClient.callRest('/api/brand-monitor/analytics/insights', {
            bearerToken: token,
        }).catch(() => null);

        return live || {
            brand: null,
            metrics: {
                visibilityScore: 0,
                visibilityDelta: 0,
                totalMentions: 0,
                organicMentions: 0,
                seededMentions: 0,
                explicitMentions: 0,
                citations: 0,
                dropsDetected: 0,
            },
            trend: [],
            byProvider: [],
            recentMentions: [],
        };
    }

    async getCompetitiveIntelligence(token?: string) {
        const live = await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
            bearerToken: token,
        }).catch(() => null);

        return {
            brand: null,
            you: null,
            competitors: [],
            shareOfVoiceTrend: [],
            trackedBrands: 0,
            ...(live || {}),
            dimensions: live?.dimensions || ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
        };
    }

    async getScanHistory(token?: string) {
        const live = await this.apiClient.callTool('get_brand_history', {}, token).catch(() => null);
        return live || {
            brand: null,
            history: [],
            totalRuns: 0,
        };
    }

    async getAiReadinessAudit(token?: string) {
        const live = await this.apiClient.callTool('get_audit_report', {}, token).catch(() => null);
        return live || {
            brand: null,
            score: 0,
            grade: 'N/A',
            crawledAt: null,
            pagesCrawled: 0,
            categories: [],
            findings: [],
            critical: 0,
            high: 0,
            status: 'not_started',
        };
    }

    async getGeoAssets(brandId?: string, token?: string) {
        const live = await this.apiClient.callTool('get_geo_assets', brandId ? { brand_id: brandId } : {}, token).catch(() => null);
        const assets = Array.isArray(live?.assets) ? live.assets : [];
        return {
            brand: live?.brand || null,
            assets,
            totalAssets: assets.length,
            published: assets.filter((a: any) => a.status === 'published').length,
            drafts: assets.filter((a: any) => a.status === 'draft').length,
            needsRefresh: assets.filter((a: any) => a.status === 'needs_refresh').length,
        };
    }

    async getAgxp(token?: string) {
        const live = await this.apiClient.callRest('/api/brand-monitor/agxp', {
            bearerToken: token,
        }).catch(() => null);

        return live || {
            brand: null,
            loopScore: 0,
            stages: [],
            lift30d: 'N/A',
        };
    }

    async getContentStudio(status?: BriefStatus, token?: string) {
        const live = await this.apiClient.callRest('/api/content-studio/briefs', {
            params: { status },
            bearerToken: token,
        }).catch(() => null);

        const briefs = Array.isArray(live?.briefs) ? live.briefs : [];
        return {
            brand: live?.brand || null,
            status: status ?? 'all',
            counts: {
                ready: briefs.filter((b: any) => b.status === 'ready').length,
                in_progress: briefs.filter((b: any) => b.status === 'in_progress').length,
                published: briefs.filter((b: any) => b.status === 'published').length,
                gap: briefs.filter((b: any) => b.status === 'gap').length,
            },
            briefs,
            totalBriefs: briefs.length,
        };
    }

    /**
     * Phase 1: Asynchronously generates live llms.txt, robots.txt, and Schema.org assets.
     */
    async generateGeoAssetsLive(brandId?: string, token?: string) {
        let liveJob: any = null;
        try {
            liveJob = await this.apiClient.callTool('generate_geo_assets', brandId ? { brand_id: brandId } : {}, token);
        } catch {
            liveJob = await this.apiClient.callRest('/api/geo-assets/generate', {
                method: 'POST',
                data: { brand_id: brandId },
                bearerToken: token,
            });
        }
        return liveJob;
    }

    /**
     * Phase 1: Initiates a live technical AEO (Answer Engine Optimization) site crawl and audit.
     */
    async triggerAeoAuditLive(brandId?: string, token?: string) {
        let liveAudit: any = null;
        try {
            liveAudit = await this.apiClient.callTool('run_aeo_audit', brandId ? { brand_id: brandId } : {}, token);
        } catch {
            liveAudit = await this.apiClient.callRest('/api/aeo-audit/generate', {
                method: 'POST',
                data: { brand_id: brandId },
                bearerToken: token,
            });
        }
        return liveAudit;
    }

    /**
     * Phase 1: Fetches the latest stored technical AEO report.
     */
    async getLatestAeoReport(brandId?: string, token?: string) {
        return await this.apiClient.callRest(`/api/aeo-audit/fetch`, {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    /**
     * Phase 1: Retrieves site technical diagnostics and AI crawler access status.
     */
    async getTechnicalDiagnostics(brandId?: string, token?: string) {
        return await this.apiClient.callRest('/api/brand-monitor/analytics/diagnostics', {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    /**
     * Phase 1: Auto-generates an Ideal Customer Profile (ICP) for the brand.
     */
    async generateIcpLive(brandId?: string, token?: string) {
        return await this.apiClient.callRest('/api/brand-monitor/audience/icp', {
            method: 'POST',
            data: { brandId },
            bearerToken: token,
        });
    }

    /**
     * Phase 1: Suggests buyer personas from free-text industry descriptions.
     */
    async suggestPersonasLive(context: {
        name?: string;
        description?: string;
        industry?: string;
        audience?: string;
        location?: string;
    }, token?: string) {
        return await this.apiClient.callRest('/api/brand-monitor/brand-profile/suggest-personas', {
            method: 'POST',
            data: context,
            bearerToken: token,
        });
    }

    /**
     * Phase 1: Adds or removes tracked competitor domains for the active brand.
     */
    async manageCompetitorLive(
        action: 'add' | 'remove' | 'list',
        competitor?: { name: string; url: string; aliases?: string[] },
        brandId?: string,
        token?: string
    ) {
        if (action === 'add' && competitor) {
            return await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                method: 'POST',
                data: competitor,
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
        } else if (action === 'remove' && competitor) {
            return await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                method: 'DELETE',
                data: { name: competitor.name, url: competitor.url },
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
        }

        return await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
            method: 'GET',
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    // =========================================================================
    // Phase 2: Content Studio & Multi-Channel Social Engine
    // =========================================================================

    /**
     * Phase 2: Generates a multi-slide LinkedIn carousel deck.
     */
    async generateCarouselLive(params: {
        topic: string;
        targetAudience?: string;
        slideCount?: number;
        theme?: 'minimal' | 'bold' | 'dark' | 'corporate';
        brandId?: string;
    }, token?: string) {
        return await this.apiClient.callRest('/api/carousel', {
            method: 'POST',
            data: params,
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Fetches an existing carousel deck by ID.
     */
    async getCarouselDeckLive(deckId: string, token?: string): Promise<CarouselDeck> {
        return await this.apiClient.callRest(`/api/carousel/${deckId}`, {
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Re-renders a carousel with updated themes or slides.
     */
    async rerenderCarouselLive(deckId: string, updates?: { theme?: string; slides?: any[] }, token?: string) {
        return await this.apiClient.callRest(`/api/carousel/${deckId}/rerender`, {
            method: 'POST',
            data: updates,
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Starts the multi-step research-grounded article wizard.
     */
    async startArticleWizardLive(params: {
        topic?: string;
        targetPrompt?: string;
        targetKeyword?: string;
        targetWordCount?: number;
        title?: string;
        persona?: string;
        brandId?: string;
    }, token?: string) {
        return await this.apiClient.callRest('/api/content-studio/wizard/projects', {
            method: 'POST',
            data: {
                topic: params.targetPrompt || params.topic,
                ...params,
            },
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Executes a discrete step of the article generation wizard.
     */
    async runArticleWizardStepLive(projectId: string, step: 'outline' | 'research' | 'draft' | 'firewall', token?: string) {
        return await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectId}/${step}`, {
            method: 'POST',
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Finalizes generated article content to a markdown blog draft.
     */
    async finalizeArticleToBlogLive(projectId: string, token?: string) {
        return await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectId}/finalize`, {
            method: 'POST',
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Repurposes an article into social formats.
     */
    async repurposeArticleLive(projectIdOrTopic: string, token?: string) {
        return await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectIdOrTopic}/repurpose`, {
            method: 'POST',
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Live paragraph rewrite for citation optimization.
     */
    async rewriteParagraphLive(params: { text: string; intent?: string; brandContext?: string }, token?: string) {
        return await this.apiClient.callRest('/api/content-studio/wizard/rewrite', {
            method: 'POST',
            data: params,
            bearerToken: token,
        });
    }

    /**
     * Phase 2: Generates single standalone social posts.
     */
    async generateStandaloneSocialLive(params: {
        platform?: 'linkedin' | 'twitter' | 'threads' | 'both';
        topic?: string;
        prompt?: string;
        tone?: string;
        brandContext?: string;
    }, token?: string) {
        return await this.apiClient.callRest('/api/content-studio/wizard/generate-social', {
            method: 'POST',
            data: {
                prompt: params.topic || params.prompt,
                ...params,
            },
            bearerToken: token,
        });
    }

    // =========================================================================
    // Phase 3: Telemetry Integrations & Backlinks
    // =========================================================================

    /**
     * Phase 3: Live backlinks snapshot.
     */
    async getBacklinksSnapshotLive(brandId?: string, token?: string): Promise<BacklinkSummary> {
        return await this.apiClient.callRest('/api/brand-monitor/backlinks/current', {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    /**
     * Phase 3: Triggers live competitor backlink refresh.
     */
    async refreshCompetitorBacklinksLive(brandId?: string, token?: string) {
        return await this.apiClient.callRest('/api/brand-monitor/backlinks/refresh', {
            method: 'POST',
            data: brandId ? { brandId } : {},
            bearerToken: token,
        });
    }

    /**
     * Phase 3: Retrieves Google Search Console query impressions and rankings.
     */
    async getSearchConsoleReportLive(days: number = 30, brandId?: string, token?: string): Promise<SearchConsoleReport> {
        return await this.apiClient.callRest('/api/brand-monitor/integrations/google-search-console/report', {
            params: { days, ...(brandId ? { brandId } : {}) },
            bearerToken: token,
        });
    }

    /**
     * Phase 3: Lists verified Search Console web properties.
     */
    async listSearchConsoleSitesLive(brandId?: string, token?: string) {
        return await this.apiClient.callRest('/api/brand-monitor/integrations/google-search-console/sites', {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    /**
     * Phase 3: Retrieves Google Analytics 4 traffic and referral telemetry.
     */
    async getGa4TrafficReportLive(brandId?: string, token?: string): Promise<Ga4TrafficReport> {
        return await this.apiClient.callRest('/api/brand-monitor/integrations/google-analytics/report', {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    /**
     * Phase 3: Retrieves Microsoft Clarity user experience telemetry.
     */
    async getClarityReportLive(brandId?: string, token?: string): Promise<ClarityReport> {
        return await this.apiClient.callRest('/api/brand-monitor/integrations/microsoft-clarity/report', {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    /**
     * Phase 3: Retrieves Google Ads campaign performance.
     */
    async getGoogleAdsReportLive(brandId?: string, token?: string): Promise<GoogleAdsReport> {
        return await this.apiClient.callRest('/api/brand-monitor/integrations/google-ads/report', {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }

    /**
     * Phase 3: Retrieves synchronization health of all third-party integrations.
     */
    async getIntegrationsStatusLive(brandId?: string, token?: string): Promise<IntegrationsStatus> {
        return await this.apiClient.callRest('/api/brand-monitor/integrations', {
            params: brandId ? { brandId } : undefined,
            bearerToken: token,
        });
    }
}
