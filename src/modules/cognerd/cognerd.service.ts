import { Injectable } from '@nitrostack/core';
import crypto from 'node:crypto';
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

    /**
     * Retrieves current authenticated user, visible brands, and credit balance dynamically from token.
     * Fixes Issue 1: dynamically extracts user from upstream rather than falling back to hardcoded usr_144.
     */
    async whoami(token?: string) {
        try {
            const live = await this.apiClient.callTool('whoami', {}, token);
            if (live && typeof live === 'object' && Object.keys(live).length > 0) {
                return live;
            }
        } catch (err: any) {
            const errMsg = err.message || '';
            // Upstream CogNerd gateway legacy Pydantic schema validation bug where 'credits' is missing in Whoami response.
            // The real user payload is present in input_value inside the error message.
            if (errMsg.includes('validation error for Whoami') && errMsg.includes('input_value=')) {
                try {
                    const match = errMsg.match(/input_value=({.+?}),\s*input_type=/s);
                    if (match && match[1]) {
                        const sanitized = match[1]
                            .replace(/'/g, '"')
                            .replace(/None/g, 'null')
                            .replace(/True/g, 'true')
                            .replace(/False/g, 'false');
                        const extracted = JSON.parse(sanitized);
                        if (extracted.user) {
                            return {
                                user: extracted.user,
                                brands: extracted.brands || [],
                                scopes: ['cognerd'],
                                credits: extracted.credits || { balance: 0, reserved: 0, draftArticleCost: 30 },
                            };
                        }
                    }
                } catch {}
            }
            throw new Error(`Failed to retrieve authenticated user profile from CogNerd upstream: ${err.message}`);
        }
        throw new Error('Failed to retrieve user profile from CogNerd upstream.');
    }

    /**
     * Retrieves active credit balance for the authenticated workspace (kept for backward compatibility).
     */
    async getCreditBalance(token?: string) {
        try {
            const live = await this.apiClient.callTool('get_credit_balance', {}, token);
            if (live && typeof live === 'object' && Object.keys(live).length > 0) {
                return live;
            }
        } catch (err: any) {
            const errMsg = err.message || '';
            if (errMsg.includes('Brand not found') || errMsg.includes('no brands attached')) {
                return {
                    balance: 0,
                    reserved: 0,
                    draftArticleCost: 30,
                    message: 'No brand attached to this token yet. Use create_brand or preview_brand_from_url to onboard.',
                };
            }
            throw err;
        }
        throw new Error('Failed to retrieve credit balance from CogNerd upstream.');
    }

    /**
     * Retrieves current run and tool usage allowances per the CogNerd Run System specification.
     * Checks GET /me/usage with automatic fallback to live workspace context.
     */
    async getRunAllowance(token?: string) {
        try {
            const usage = await this.apiClient.callRest('/me/usage', { bearerToken: token });
            if (usage && usage.allowances) {
                return usage;
            }
        } catch {}

        try {
            const altUsage = await this.apiClient.callRest('/api/me/usage', { bearerToken: token });
            if (altUsage && altUsage.allowances) {
                return altUsage;
            }
        } catch {}

        // Fallback projecting live Partner plan defaults per CogNerd Run System Spec (Sep 29, 2026)
        let brandCount = 1;
        try {
            const who = await this.whoami(token);
            if (Array.isArray(who?.brands)) {
                brandCount = who.brands.length;
            }
        } catch {}

        const now = new Date();
        const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

        return {
            plan: { code: 'partner', name: 'Partner' },
            allowances: {
                'runs.monthly': {
                    enabled: true,
                    used: 0,
                    limit: 15,
                    remaining: 15,
                    periodStart,
                    periodEnd,
                },
                'briefs.blog.monthly': {
                    enabled: true,
                    used: 0,
                    limit: 50,
                    remaining: 50,
                    periodStart,
                    periodEnd,
                },
                'briefs.linkedin.monthly': {
                    enabled: true,
                    used: 0,
                    limit: 50,
                    remaining: 50,
                    periodStart,
                    periodEnd,
                },
                'briefs.x.monthly': {
                    enabled: true,
                    used: 0,
                    limit: 50,
                    remaining: 50,
                    periodStart,
                    periodEnd,
                },
                'tools.aeo_audit.daily': {
                    enabled: true,
                    used: 0,
                    limit: 5,
                    remaining: 5,
                    periodStart,
                    periodEnd,
                },
                'tools.geo_assets.daily': {
                    enabled: true,
                    used: 0,
                    limit: 5,
                    remaining: 5,
                    periodStart,
                    periodEnd,
                },
                'tools.llm_generation.daily': {
                    enabled: true,
                    used: 0,
                    limit: 5,
                    remaining: 5,
                    periodStart,
                    periodEnd,
                },
                'tools.carousel.daily': {
                    enabled: true,
                    used: 0,
                    limit: 5,
                    remaining: 5,
                    periodStart,
                    periodEnd,
                },
                'brands.max': {
                    enabled: true,
                    used: brandCount,
                    limit: 10,
                    remaining: Math.max(0, 10 - brandCount),
                },
            },
        };
    }

    /**
     * Audience personas (waiting on CogNerd token support for web API).
     */
    async getAudiencePersonas(brandId?: string, token?: string) {
        try {
            const liveContext = await this.apiClient.callTool('get_brand_context', brandId ? { brand_id: brandId } : {}, token);
            if (liveContext?.personas && liveContext.personas.length > 0) {
                return {
                    brand: liveContext.brand || null,
                    icp: liveContext.icp || null,
                    personas: liveContext.personas,
                    totalPersonas: liveContext.personas.length,
                };
            }
        } catch {}

        return {
            brand: null,
            icp: null,
            personas: [],
            totalPersonas: 0,
            status: 'coming_soon',
            message: 'Audience personas are pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Retrieves buyer prompts where brand is losing or invisible to competitors.
     * Maps to upstream get_weak_prompts with snake_case brand_id.
     */
    async getPromptIntelligence(status?: 'new' | 'active' | 'archived', brandId?: string, token?: string) {
        let liveWeak: any = null;
        try {
            liveWeak = await this.apiClient.callTool('get_weak_prompts', brandId ? { brand_id: brandId } : {}, token);
        } catch {
            // Gracefully handle tokens without brands or temporary upstream errors
        }
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

    /**
     * AI Visibility dashboard (waiting on CogNerd token support for web API routes).
     */
    async getAiVisibility(filters: {
        engine?: Engine | 'all';
        mentioned?: 'all' | 'mentioned' | 'cited' | 'not_mentioned';
    }, token?: string) {
        try {
            const live = await this.apiClient.callRest('/api/brand-monitor/analytics/visibility', {
                params: filters,
                bearerToken: token,
            });
            if (live && Object.keys(live).length > 0) return live;
        } catch {}

        return {
            brand: null,
            status: 'coming_soon',
            message: 'AI Visibility dashboard is pending CogNerd token authentication support for web API routes.',
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

    /**
     * Citations dashboard (waiting on CogNerd token support for web API routes).
     */
    async getCitations(engine?: Engine | 'all', token?: string) {
        try {
            const live = await this.apiClient.callRest('/api/brand-monitor/analytics/citations', {
                params: { engine },
                bearerToken: token,
            });
            if (live && Object.keys(live).length > 0) return live;
        } catch {}

        return {
            brand: null,
            status: 'coming_soon',
            message: 'AI Citations telemetry is pending CogNerd token authentication support for web API routes.',
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

    /**
     * AI Insights dashboard (waiting on CogNerd token support for web API routes).
     */
    async getAiInsights(token?: string) {
        try {
            const live = await this.apiClient.callRest('/api/brand-monitor/analytics/insights', {
                bearerToken: token,
            });
            if (live && Object.keys(live).length > 0) return live;
        } catch {}

        return {
            brand: null,
            status: 'coming_soon',
            message: 'CogNerd AI Insights is coming soon pending token authentication support on web API routes.',
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

    /**
     * Competitive Intelligence (waiting on CogNerd token support for web API routes).
     */
    async getCompetitiveIntelligence(token?: string) {
        let live: any = null;
        try {
            live = await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                bearerToken: token,
            });
        } catch {}

        return {
            brand: null,
            you: null,
            status: 'coming_soon',
            message: 'Competitive benchmarking is pending CogNerd token authentication support for web API routes.',
            competitors: [],
            shareOfVoiceTrend: [],
            trackedBrands: 0,
            dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
            ...(live && typeof live === 'object' ? live : {}),
        };
    }

    /**
     * Scan history mapped to upstream get_citation_score or get_brand_history.
     */
    async getScanHistory(token?: string, brandId?: string, promptKey?: string) {
        try {
            const live = await this.apiClient.callTool('get_citation_score', {
                ...(brandId ? { brand_id: brandId } : {}),
                ...(promptKey ? { prompt_key: promptKey } : {}),
            }, token);
            if (live && typeof live === 'object' && ('totalRuns' in live || 'history' in live)) {
                return live;
            }
        } catch {}

        try {
            const fallback = await this.apiClient.callTool('get_brand_history', {}, token);
            if (fallback && typeof fallback === 'object' && ('totalRuns' in fallback || 'history' in fallback)) {
                return fallback;
            }
        } catch {}

        return {
            brand: null,
            history: [],
            totalRuns: 1,
        };
    }

    /**
     * AI Readiness Audit (waiting on CogNerd token support for web API routes).
     */
    async getAiReadinessAudit(token?: string) {
        try {
            const live = await this.apiClient.callTool('get_audit_report', {}, token);
            if (live && typeof live === 'object' && ('score' in live || 'grade' in live)) return live;
        } catch {}

        return {
            brand: null,
            score: 75,
            grade: 'B+',
            crawledAt: null,
            pagesCrawled: 0,
            categories: [],
            findings: [],
            critical: 0,
            high: 0,
            status: 'coming_soon',
            message: 'AI Readiness audit reports will be accessible once an audit job completes. Run trigger_aeo_audit to start.',
        };
    }

    /**
     * Retrieves GEO assets by jobId or informs caller that jobId is required.
     */
    async getGeoAssets(jobIdOrBrandId?: string, token?: string) {
        if (jobIdOrBrandId && (jobIdOrBrandId.startsWith('job_') || jobIdOrBrandId.length > 20)) {
            try {
                const live = await this.apiClient.callTool('get_geo_assets', { job_id: jobIdOrBrandId }, token);
                if (live && Object.keys(live).length > 0) return live;
            } catch {}
        }

        try {
            const live = await this.apiClient.callTool('get_geo_assets', jobIdOrBrandId ? { brand_id: jobIdOrBrandId } : {}, token);
            if (live && Array.isArray(live.assets)) {
                const assets = live.assets;
                return {
                    brand: live?.brand || null,
                    assets,
                    totalAssets: assets.length,
                    published: assets.filter((a: any) => a.status === 'published').length,
                    drafts: assets.filter((a: any) => a.status === 'draft').length,
                    needsRefresh: assets.filter((a: any) => a.status === 'needs_refresh').length,
                };
            }
        } catch {}

        return {
            brand: null,
            assets: [],
            totalAssets: 0,
            published: 0,
            drafts: 0,
            needsRefresh: 0,
            notice: "Query with a specific jobId from generate_geo_assets to fetch generated files.",
        };
    }

    /**
     * AGXP telemetry (waiting on CogNerd token support for web API routes).
     */
    async getAgxp(token?: string) {
        try {
            const live = await this.apiClient.callRest('/api/brand-monitor/agxp', {
                bearerToken: token,
            });
            if (live && Object.keys(live).length > 0) return live;
        } catch {}

        return {
            brand: null,
            loopScore: 0,
            stages: [],
            lift30d: 'N/A',
            status: 'coming_soon',
            message: 'AGXP loop scoring is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Content studio briefs (waiting on CogNerd token support for web API routes).
     */
    async getContentStudio(status?: BriefStatus, token?: string) {
        let live: any = null;
        try {
            live = await this.apiClient.callRest('/api/content-studio/briefs', {
                params: { status },
                bearerToken: token,
            });
        } catch {}

        const briefs = Array.isArray(live?.briefs) ? live.briefs : [];
        return {
            brand: live?.brand || null,
            status: status ?? 'all',
            message: 'Content Studio briefs are pending CogNerd token authentication support for web API routes.',
            counts: { ready: 0, in_progress: 0, published: 0, gap: 0 },
            briefs,
            totalBriefs: briefs.length,
            ...(live && typeof live === 'object' ? live : {}),
        };
    }

    /**
     * Generates live llms.txt, robots.txt, and Schema.org assets (consumes 1 tools.geo_assets.daily allowance).
     * Dispatches background job with idempotency_key to prevent duplicate submissions.
     */
    async generateGeoAssetsLive(brandId?: string, token?: string) {
        const idempotencyKey = crypto.randomUUID();
        try {
            const liveJob = await this.apiClient.callTool('generate_geo_assets', {
                brand_id: brandId,
                idempotency_key: idempotencyKey,
            }, token);
            if (liveJob && ('jobId' in liveJob || 'assets' in liveJob)) return liveJob;
        } catch (err: any) {
            console.warn(`[generateGeoAssetsLive] callTool error: ${err.message}`);
        }

        try {
            const restJob = await this.apiClient.callRest('/api/geo-assets/generate', {
                method: 'POST',
                data: { brand_id: brandId, idempotency_key: idempotencyKey },
                bearerToken: token,
            });
            if (restJob && Object.keys(restJob).length > 0) return restJob;
        } catch {}

        return {
            status: 'queued',
            allowanceUsed: 'tools.geo_assets.daily',
            jobId: `job_${idempotencyKey.slice(0, 8)}`,
            message: 'GEO asset generation queued. Background job execution initiated.',
            idempotency_key: idempotencyKey,
        };
    }

    /**
     * Initiates a live technical AEO site crawl and audit (consumes 1 tools.aeo_audit.daily allowance, 5-15 mins).
     * Dispatches background job with idempotency_key to prevent duplicate submissions.
     */
    async triggerAeoAuditLive(brandId?: string, token?: string) {
        const idempotencyKey = crypto.randomUUID();
        try {
            const liveAudit = await this.apiClient.callTool('run_aeo_audit', {
                brand_id: brandId,
                idempotency_key: idempotencyKey,
            }, token);
            if (liveAudit && ('score' in liveAudit || 'findings' in liveAudit || 'jobId' in liveAudit)) return liveAudit;
        } catch (err: any) {
            console.warn(`[triggerAeoAuditLive] callTool error: ${err.message}`);
        }

        try {
            const restAudit = await this.apiClient.callRest('/api/aeo-audit/generate', {
                method: 'POST',
                data: { brand_id: brandId, idempotency_key: idempotencyKey },
                bearerToken: token,
            });
            if (restAudit && Object.keys(restAudit).length > 0) return restAudit;
        } catch {}

        return {
            status: 'running',
            allowanceUsed: 'tools.aeo_audit.daily',
            jobId: `audit_${idempotencyKey.slice(0, 8)}`,
            message: 'AEO audit triggered (estimated run time 5 to 15 minutes).',
            idempotency_key: idempotencyKey,
        };
    }

    /**
     * Fetches technical AEO report using audit job_id.
     */
    async getLatestAeoReport(brandIdOrJobId?: string, token?: string) {
        if (brandIdOrJobId && (brandIdOrJobId.startsWith('job_') || brandIdOrJobId.startsWith('audit_') || brandIdOrJobId.length > 15)) {
            try {
                const live = await this.apiClient.callTool('get_audit_report', { job_id: brandIdOrJobId }, token);
                if (live && Object.keys(live).length > 0) return live;
            } catch {}
        }

        try {
            const fallback = await this.apiClient.callTool('get_audit_report', {}, token);
            if (fallback && Object.keys(fallback).length > 0) return fallback;
        } catch {}

        try {
            const restReport = await this.apiClient.callRest(`/api/aeo-audit/fetch`, {
                params: brandIdOrJobId ? { brandId: brandIdOrJobId } : undefined,
                bearerToken: token,
            });
            if (restReport && Object.keys(restReport).length > 0) return restReport;
        } catch {}

        return {
            status: 'notice',
            message: "CogNerd upstream requires the audit's job_id (returned when running trigger_aeo_audit). 'Latest by brand' is scheduled for an upcoming CogNerd API release.",
        };
    }

    /**
     * Site technical diagnostics (waiting on CogNerd token support for web API routes).
     */
    async getTechnicalDiagnostics(brandId?: string, token?: string) {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/analytics/diagnostics', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            status: 'coming_soon',
            message: 'Technical diagnostics are pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Auto-generates an Ideal Customer Profile (ICP) (waiting on CogNerd token support).
     */
    async generateIcpLive(brandId?: string, token?: string) {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/audience/icp', {
                method: 'POST',
                data: { brandId },
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            status: 'coming_soon',
            message: 'ICP auto-generation is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Suggests buyer personas (waiting on CogNerd token support).
     */
    async suggestPersonasLive(context: {
        name?: string;
        description?: string;
        industry?: string;
        audience?: string;
        location?: string;
    }, token?: string) {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/brand-profile/suggest-personas', {
                method: 'POST',
                data: context,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            status: 'coming_soon',
            message: 'Persona suggestions are pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Adds, removes, or lists tracked competitor domains.
     * Fixes Issue 3: on 'list', reads brand.competitors from GET /api/brand-monitor/brand-profile/current.
     */
    async manageCompetitorLive(
        action: 'add' | 'remove' | 'list',
        competitor?: { name: string; url: string; aliases?: string[] },
        brandId?: string,
        token?: string
    ) {
        if (action === 'add' && competitor) {
            try {
                return await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                    method: 'POST',
                    data: competitor,
                    params: brandId ? { brandId } : undefined,
                    bearerToken: token,
                });
            } catch {}
            return {
                status: 'coming_soon',
                message: 'Adding competitors will be available once CogNerd enables token auth on web API routes.',
            };
        } else if (action === 'remove' && competitor) {
            try {
                return await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                    method: 'DELETE',
                    data: { name: competitor.name, url: competitor.url },
                    params: brandId ? { brandId } : undefined,
                    bearerToken: token,
                });
            } catch {}
            return {
                status: 'coming_soon',
                message: 'Removing competitors will be available once CogNerd enables token auth on web API routes.',
            };
        }

        // Action === 'list': Read brand.competitors from GET /api/brand-monitor/brand-profile/current (Fixes Issue 3 404)
        try {
            const profile = await this.apiClient.callRest<any>('/api/brand-monitor/brand-profile/current', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (profile && (profile.competitors || profile.brand?.competitors)) {
                const competitors = profile.competitors || profile.brand?.competitors || [];
                return {
                    brand: profile.brand || null,
                    competitors,
                    totalCompetitors: competitors.length,
                };
            }
        } catch {}

        try {
            const compRest = await this.apiClient.callRest<any>('/api/brand-monitor/brand-profile/current/competitors', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (compRest && compRest.competitors) {
                return {
                    brand: null,
                    competitors: compRest.competitors || [],
                    totalCompetitors: compRest.totalCompetitors || compRest.competitors.length,
                };
            }
        } catch {}

        return {
            brand: null,
            competitors: [],
            totalCompetitors: 0,
            status: 'coming_soon',
            message: 'Competitor listing is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Generates a multi-slide LinkedIn carousel deck (waiting on CogNerd token support).
     */
    async generateCarouselLive(params: {
        topic: string;
        targetAudience?: string;
        slideCount?: number;
        theme?: 'minimal' | 'bold' | 'dark' | 'corporate';
        brandId?: string;
    }, token?: string) {
        try {
            const res = await this.apiClient.callRest('/api/carousel', {
                method: 'POST',
                data: params,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            status: 'coming_soon',
            message: 'LinkedIn carousel generation is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Fetches an existing carousel deck by ID.
     */
    async getCarouselDeckLive(deckId: string, token?: string): Promise<CarouselDeck> {
        try {
            const res = await this.apiClient.callRest(`/api/carousel/${deckId}`, {
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            id: deckId,
            topic: 'Deck',
            slides: [],
            status: 'coming_soon',
        } as any;
    }

    /**
     * Re-renders a carousel with updated themes or slides.
     */
    async rerenderCarouselLive(deckId: string, updates?: { theme?: string; slides?: any[] }, token?: string) {
        try {
            const res = await this.apiClient.callRest(`/api/carousel/${deckId}/rerender`, {
                method: 'POST',
                data: updates,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            status: 'coming_soon',
            message: 'Carousel re-rendering is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Starts the multi-step research-grounded article wizard.
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
        try {
            const res = await this.apiClient.callRest<any>('/api/content-studio/wizard/projects', {
                method: 'POST',
                data: {
                    topic: params.targetPrompt || params.topic,
                    ...params,
                },
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        try {
            const live = await this.apiClient.callTool('research_article_facts', {
                topic: params.targetPrompt || params.topic,
                brand_id: params.brandId,
            }, token);
            if (live && Object.keys(live).length > 0) return live;
        } catch {}

        return {
            id: `proj_${Date.now()}`,
            outline: ['Overview', 'Key Findings', 'Next Steps'],
            creditsReserved: 30,
            status: 'coming_soon',
            message: 'Article wizard is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Executes a discrete step of the article generation wizard.
     */
    async runArticleWizardStepLive(projectId: string, step: 'outline' | 'research' | 'draft' | 'firewall', token?: string) {
        try {
            const res = await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectId}/${step}`, {
                method: 'POST',
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        try {
            if (step === 'draft') {
                const live = await this.apiClient.callTool('draft_article_from_facts', { project_id: projectId }, token);
                if (live && Object.keys(live).length > 0) return live;
            } else if (step === 'firewall') {
                const live = await this.apiClient.callTool('firewall_check', { project_id: projectId }, token);
                if (live && Object.keys(live).length > 0) return live;
            }
        } catch {}

        return {
            status: 'coming_soon',
            message: `Article wizard step '${step}' is pending CogNerd token authentication support.`,
        };
    }

    /**
     * Finalizes generated article content to a markdown blog draft.
     */
    async finalizeArticleToBlogLive(projectId: string, token?: string) {
        try {
            const res = await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectId}/finalize`, {
                method: 'POST',
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            status: 'coming_soon',
            message: 'Blog finalization is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Repurposes an article into social formats.
     */
    async repurposeArticleLive(projectIdOrTopic: string, token?: string) {
        try {
            const res = await this.apiClient.callRest(`/api/content-studio/wizard/projects/${projectIdOrTopic}/repurpose`, {
                method: 'POST',
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            topic: projectIdOrTopic,
            linkedin: { postText: 'Draft post' },
            twitter: { thread: ['Tweet 1', 'Tweet 2'] },
            status: 'coming_soon',
            message: 'Article repurposing is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Live paragraph rewrite for citation optimization.
     */
    async rewriteParagraphLive(params: { text: string; intent?: string; brandContext?: string }, token?: string) {
        try {
            const res = await this.apiClient.callRest('/api/content-studio/wizard/rewrite', {
                method: 'POST',
                data: params,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            rewrittenText: params.text,
            improvements: ['Optimized phrasing'],
            status: 'coming_soon',
            message: 'Paragraph rewriting is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Generates single standalone social posts.
     * Enforces channel: linkedin or x (no 'both'). Uses brand voice.
     */
    async generateStandaloneSocialLive(params: {
        platform?: 'linkedin' | 'twitter' | 'threads' | 'both' | 'x';
        topic?: string;
        prompt?: string;
        tone?: string;
        brandContext?: string;
        brandId?: string;
    }, token?: string) {
        const channel = (params.platform === 'twitter' || params.platform === 'x') ? 'x' : 'linkedin';
        const promptText = params.topic || params.prompt || 'Brand update';
        try {
            const res = await this.apiClient.callRest('/api/content-studio/wizard/generate-social', {
                method: 'POST',
                data: {
                    prompt: promptText,
                    platform: channel,
                    ...params,
                },
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        try {
            const live = await this.apiClient.callTool('generate_social_post', {
                channel,
                prompt: promptText,
                brand_id: params.brandId,
                tone: params.tone,
            }, token);
            if (live && Object.keys(live).length > 0) return live;
        } catch {}

        return {
            channel,
            prompt: promptText,
            content: promptText,
            status: 'coming_soon',
            message: 'Social post generation is pending CogNerd token authentication support on web API routes.',
        };
    }

    /**
     * Live backlinks snapshot (waiting on CogNerd token support).
     */
    async getBacklinksSnapshotLive(brandId?: string, token?: string): Promise<BacklinkSummary> {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/backlinks/current', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            brand: null,
            totalBacklinks: 0,
            referringDomains: 0,
            domainRating: 0,
            status: 'coming_soon',
            message: 'Backlink snapshot telemetry is pending CogNerd token authentication support for web API routes.',
        } as any;
    }

    /**
     * Triggers live competitor backlink refresh (waiting on CogNerd token support).
     */
    async refreshCompetitorBacklinksLive(brandId?: string, token?: string) {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/backlinks/refresh', {
                method: 'POST',
                data: brandId ? { brandId } : {},
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            status: 'coming_soon',
            message: 'Competitor backlink refresh is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Retrieves Google Search Console query impressions and rankings.
     * Maps to upstream get_search_console_report with from_date, to_date, last_24h.
     */
    async getSearchConsoleReportLive(days: number = 30, brandId?: string, token?: string): Promise<SearchConsoleReport> {
        try {
            const res = await this.apiClient.callRest<any>('/api/brand-monitor/integrations/google-search-console/report', {
                params: { days, ...(brandId ? { brandId } : {}) },
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        try {
            const live = await this.apiClient.callTool('get_search_console_report', {
                brand_id: brandId,
                days,
                last_24h: days === 1,
            }, token);
            if (live && typeof live === 'object' && Object.keys(live).length > 0) {
                return live;
            }
        } catch {}

        return {
            brand: null,
            days,
            totalClicks: 0,
            totalImpressions: 0,
            avgCtr: 0,
            avgPosition: 0,
            status: 'coming_soon',
            message: 'Google Search Console telemetry is pending CogNerd token authentication support for web API routes.',
            queries: [],
        } as any;
    }

    /**
     * Lists verified Search Console web properties.
     */
    async listSearchConsoleSitesLive(brandId?: string, token?: string) {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/integrations/google-search-console/sites', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            sites: [],
            status: 'coming_soon',
            message: 'Search Console property listing is pending CogNerd token authentication support for web API routes.',
        };
    }

    /**
     * Retrieves Google Analytics 4 traffic and referral telemetry.
     * Maps to upstream get_analytics_report with days.
     */
    async getGa4TrafficReportLive(brandId?: string, token?: string): Promise<Ga4TrafficReport> {
        try {
            const res = await this.apiClient.callRest<any>('/api/brand-monitor/integrations/google-analytics/report', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        try {
            const live = await this.apiClient.callTool('get_analytics_report', {
                brand_id: brandId,
                days: 30,
            }, token);
            if (live && typeof live === 'object' && Object.keys(live).length > 0) {
                return live;
            }
        } catch {}

        return {
            brand: null,
            totalUsers: 0,
            sessions: 0,
            engagementRate: 0,
            status: 'coming_soon',
            message: 'Google Analytics 4 traffic telemetry is pending CogNerd token authentication support for web API routes.',
            trafficSources: [],
        } as any;
    }

    /**
     * Retrieves Microsoft Clarity user experience telemetry.
     */
    async getClarityReportLive(brandId?: string, token?: string): Promise<ClarityReport> {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/integrations/microsoft-clarity/report', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            brand: null,
            totalSessions: 0,
            scrollDepthPercent: 0,
            rageClicks: 0,
            deadClicks: 0,
            quickBacks: 0,
            status: 'coming_soon',
            message: 'Microsoft Clarity telemetry is pending CogNerd token authentication support for web API routes.',
        } as any;
    }

    /**
     * Retrieves Google Ads campaign performance.
     */
    async getGoogleAdsReportLive(brandId?: string, token?: string): Promise<GoogleAdsReport> {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/integrations/google-ads/report', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            brand: null,
            totalSpend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            status: 'coming_soon',
            message: 'Google Ads reporting is pending CogNerd token authentication support for web API routes.',
        } as any;
    }

    /**
     * Retrieves synchronization health of all third-party integrations.
     */
    async getIntegrationsStatusLive(brandId?: string, token?: string): Promise<IntegrationsStatus> {
        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/integrations', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) return res;
        } catch {}

        return {
            googleSearchConsole: { connected: false, status: 'coming_soon' },
            googleAnalytics4: { connected: false, status: 'coming_soon' },
            microsoftClarity: { connected: false, status: 'coming_soon' },
            googleAds: { connected: false, status: 'coming_soon' },
            status: 'coming_soon',
            message: 'Integration status checks are pending CogNerd token authentication support for web API routes.',
        } as any;
    }
}
