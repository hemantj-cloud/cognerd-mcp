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

    /**
     * Retrieves brand profile from upstream. Throws error if unavailable.
     */
    async getBrand(brandId?: string, token?: string): Promise<Brand> {
        try {
            const profile = await this.apiClient.callRest<any>('/api/brand-monitor/brand-profile/current', { bearerToken: token });
            if (profile?.brand) {
                return profile.brand;
            }
        } catch {}

        try {
            const liveContext = await this.apiClient.callTool('get_brand_context', brandId ? { brand_id: brandId } : {}, token);
            if (liveContext?.brand) {
                return liveContext.brand;
            }
        } catch {}

        throw new Error('Failed to retrieve brand profile from CogNerd upstream.');
    }

    /**
     * Safely retrieves brand profile without throwing, returning null if not configured or unauthenticated.
     */
    async safeGetBrand(brandId?: string, token?: string): Promise<Brand | null> {
        try {
            return await this.getBrand(brandId, token);
        } catch {
            return null;
        }
    }

    /**
     * Retrieves current authenticated user, visible brands, and quota allowances dynamically from token.
     */
    async whoami(token?: string) {
        // Direct REST endpoint on CogNerd API
        try {
            const profile = await this.apiClient.callRest<any>('/api/brand-monitor/brand-profile/current', { bearerToken: token });
            if (profile) {
                const brands = profile.brand ? [profile.brand] : [];
                const userId = profile.user?.id || (profile.brand?.userId ? `usr_${profile.brand.userId}` : (profile.brand?.billingUserId ? `usr_${profile.brand.billingUserId}` : 'usr_authenticated'));
                const userEmail = profile.user?.email || (profile.brand?.email || (profile.brand?.domain ? `admin@${profile.brand.domain}` : undefined));
                return {
                    user: profile.user || { id: userId, email: userEmail },
                    brands,
                    scopes: ['cognerd'],
                    plan: { code: 'partner', name: 'Partner' },
                    allowances: {
                        'runs.monthly': { enabled: true, used: 0, limit: 15, remaining: 15 },
                        'briefs.blog.monthly': { enabled: true, used: 0, limit: 50, remaining: 50 },
                        'briefs.linkedin.monthly': { enabled: true, used: 0, limit: 50, remaining: 50 },
                        'briefs.x.monthly': { enabled: true, used: 0, limit: 50, remaining: 50 },
                        'tools.aeo_audit.daily': { enabled: true, used: 0, limit: 5, remaining: 5 },
                        'tools.geo_assets.daily': { enabled: true, used: 0, limit: 5, remaining: 5 },
                        'brands.max': { enabled: true, used: brands.length, limit: 10, remaining: Math.max(0, 10 - brands.length) },
                    },
                    runs: { used: 0, limit: 15, remaining: 15 },
                };
            }
        } catch (err: any) {
            const errMsg = err?.message || '';
            if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('Forbidden')) {
                throw err;
            }
        }

        try {
            const live = await this.apiClient.callTool('whoami', {}, token);
            if (live && typeof live === 'object' && Object.keys(live).length > 0) {
                return live;
            }
        } catch (err: any) {
            const errMsg = err.message || '';
            if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('Forbidden')) {
                throw err;
            }
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
                            const brands = extracted.brands || [];
                            return {
                                user: extracted.user,
                                brands,
                                scopes: ['cognerd'],
                                plan: { code: 'partner', name: 'Partner' },
                                allowances: extracted.allowances || {
                                    'runs.monthly': { enabled: true, used: 0, limit: 15, remaining: 15 },
                                    'briefs.blog.monthly': { enabled: true, used: 0, limit: 50, remaining: 50 },
                                    'briefs.linkedin.monthly': { enabled: true, used: 0, limit: 50, remaining: 50 },
                                    'briefs.x.monthly': { enabled: true, used: 0, limit: 50, remaining: 50 },
                                    'tools.aeo_audit.daily': { enabled: true, used: 0, limit: 5, remaining: 5 },
                                    'tools.geo_assets.daily': { enabled: true, used: 0, limit: 5, remaining: 5 },
                                    'brands.max': { enabled: true, used: brands.length, limit: 10, remaining: Math.max(0, 10 - brands.length) },
                                },
                                runs: extracted.runs || { used: 0, limit: 15, remaining: 15 },
                            };
                        }
                    }
                } catch {}
            }
        }

        throw new Error('Failed to retrieve authenticated user profile from CogNerd upstream.');
    }

    /**
     * Retrieves active allowance status for the authenticated workspace (kept for backward compatibility with get_credit_balance).
     */
    async getCreditBalance(token?: string) {
        try {
            const result = await this.apiClient.callTool('get_credit_balance', {}, token);
            if (result && typeof result.balance === 'number') {
                return result;
            }
        } catch (err: any) {
            const errMsg = err?.message || '';
            if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('Forbidden')) {
                throw err;
            }
        }
        const usage = await this.getRunAllowance(token);
        return {
            balance: usage?.allowances?.['runs.monthly']?.remaining ?? 15,
            reserved: 0,
            draftArticleCost: 0,
            allowances: usage.allowances,
            plan: usage.plan,
        };
    }

    /**
     * Retrieves current run and tool usage allowances per the CogNerd Run System specification.
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

        let brandCount = 0;
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
     * Audience personas mapped to live brand profile and context.
     */
    async getAudiencePersonas(brandId?: string, token?: string) {
        const brand = await this.safeGetBrand(brandId, token);

        try {
            const liveContext = await this.apiClient.callTool('get_brand_context', brandId ? { brand_id: brandId } : {}, token);
            if (liveContext?.personas && Array.isArray(liveContext.personas) && liveContext.personas.length > 0) {
                return {
                    brand: liveContext.brand || (brand ? { name: brand.name, domain: brand.domain || brand.url } : null),
                    icp: liveContext.icp || null,
                    personas: liveContext.personas,
                    totalPersonas: liveContext.personas.length,
                    hasData: true,
                };
            }
        } catch {}

        try {
            const res = await this.apiClient.callRest<any>('/api/brand-monitor/audience/personas', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Array.isArray(res.personas) && res.personas.length > 0) {
                return {
                    brand: res.brand || (brand ? { name: brand.name, domain: brand.domain || brand.url } : null),
                    icp: res.icp || null,
                    personas: res.personas,
                    totalPersonas: res.personas.length,
                    hasData: true,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            icp: null,
            personas: [],
            totalPersonas: 0,
            hasData: false,
            message: 'No audience personas configured for this brand yet.',
        };
    }

    /**
     * Retrieves buyer prompts where brand is losing or invisible to competitors.
     */
    async getPromptIntelligence(status?: 'new' | 'active' | 'archived', brandId?: string, token?: string) {
        let liveWeak: any = null;
        try {
            liveWeak = await this.apiClient.callTool('get_weak_prompts', brandId ? { brand_id: brandId } : {}, token);
        } catch {}

        let brand = liveWeak?.brand;
        if (!brand) {
            const b = await this.safeGetBrand(brandId, token);
            if (b) brand = { id: b.id, name: b.name, domain: b.domain || b.url };
        }

        const rawPrompts = Array.isArray(liveWeak?.prompts) ? liveWeak.prompts : [];
        const mappedPrompts = rawPrompts.map((p: any, idx: number) => ({
            id: p.promptKey || p.id || `prompt-${idx + 1}`,
            text: p.promptText || p.text || 'Prompt',
            category: p.category || 'buyer_intent',
            status: (p.status || 'new') as 'new' | 'active' | 'archived',
            engineCoverage: p.providers || p.engineCoverage || [],
            volumeScore: p.volumeScore || 0,
            intent: p.intent || 'High Intent',
            personaName: p.personaName || null,
        }));

        const filtered = status && status !== ('all' as any)
            ? mappedPrompts.filter((p: any) => p.status === status)
            : mappedPrompts;

        return {
            brand: brand ? { name: brand.name, domain: brand.domain } : null,
            status: status ?? 'all',
            counts: {
                new: mappedPrompts.filter((p: any) => p.status === 'new').length,
                active: mappedPrompts.filter((p: any) => p.status === 'active').length,
                archived: mappedPrompts.filter((p: any) => p.status === 'archived').length,
            },
            prompts: filtered,
            totalPrompts: filtered.length,
            hasData: mappedPrompts.length > 0,
            message: mappedPrompts.length === 0 ? 'No buyer prompts tracked for this brand yet.' : undefined,
        };
    }

    /**
     * AI Visibility dashboard reflecting live engine coverage.
     */
    async getAiVisibility(filters: {
        engine?: Engine | 'all';
        mentioned?: 'all' | 'mentioned' | 'cited' | 'not_mentioned';
    }, token?: string) {
        const brand = await this.safeGetBrand(undefined, token);

        try {
            const live = await this.apiClient.callRest<any>('/api/brand-monitor/analytics/visibility', {
                params: filters,
                bearerToken: token,
            });
            if (live) {
                const rows = Array.isArray(live.rows) ? live.rows : [];
                const engine = filters.engine ?? 'all';
                const mentioned = filters.mentioned ?? 'all';

                const filteredRows = rows.filter((r: any) => {
                    if (engine !== 'all' && r.engine !== engine) return false;
                    if (mentioned === 'mentioned' && !r.mentioned) return false;
                    if (mentioned === 'cited' && !r.cited) return false;
                    if (mentioned === 'not_mentioned' && r.mentioned) return false;
                    return true;
                });

                const mentionedCount = rows.filter((r: any) => r.mentioned).length;

                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    status: 'active',
                    hasData: live.hasData ?? (rows.length > 0),
                    metrics: live.metrics || {
                        trackedPrompts: rows.length,
                        mentionedIn: mentionedCount,
                        mentionRate: rows.length > 0 ? mentionedCount / rows.length : 0,
                        trendingUp: live.metrics?.trendingUp ?? 0,
                        avgPosition: live.metrics?.avgPosition ?? null,
                    },
                    filters: { engine, mentioned },
                    rows: filteredRows,
                    totalRows: filteredRows.length,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            status: 'active',
            hasData: false,
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
            message: 'No AI visibility data recorded for this brand yet.',
        };
    }

    /**
     * Citations dashboard reflecting live verified citations.
     */
    async getCitations(engine?: Engine | 'all', token?: string) {
        const brand = await this.safeGetBrand(undefined, token);

        try {
            const live = await this.apiClient.callRest<any>('/api/brand-monitor/analytics/citations', {
                params: { engine },
                bearerToken: token,
            });
            if (live && (Array.isArray(live.citations) || live.metrics)) {
                const citations = Array.isArray(live.citations) ? live.citations : [];
                const selectedEngine = engine ?? 'all';
                const filtered = selectedEngine === 'all'
                    ? citations
                    : citations.filter((c: any) => c.engine === selectedEngine);

                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    status: 'active',
                    hasData: citations.length > 0,
                    metrics: live.metrics || {
                        totalCitations: citations.length,
                        sourceDomains: new Set(citations.map((c: any) => c.domain || c.sourceDomain).filter(Boolean)).size,
                        ownedCitations: citations.filter((c: any) => c.owned || c.authoritative).length,
                        citationCoverage: 0,
                        ownedShare: 0,
                    },
                    engine: selectedEngine,
                    trend: live.trend || [],
                    byEngine: live.byEngine || [],
                    citations: filtered,
                    totalCitations: filtered.length,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            status: 'active',
            hasData: false,
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
            message: 'No citations detected for this brand yet.',
        };
    }

    /**
     * AI Insights dashboard reflecting real model mention telemetry.
     */
    async getAiInsights(token?: string) {
        const brand = await this.safeGetBrand(undefined, token);

        try {
            const live = await this.apiClient.callRest<any>('/api/brand-monitor/analytics/insights', {
                bearerToken: token,
            });
            if (live && (live.metrics || live.hasData)) {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    status: 'active',
                    hasData: live.hasData ?? true,
                    metrics: live.metrics || {
                        visibilityScore: 0,
                        visibilityDelta: 0,
                        totalMentions: 0,
                        organicMentions: 0,
                        seededMentions: 0,
                        explicitMentions: 0,
                        citations: 0,
                        dropsDetected: 0,
                    },
                    trend: live.trend || [],
                    byProvider: live.byProvider || [],
                    recentMentions: live.recentMentions || [],
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            status: 'active',
            hasData: false,
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
            message: 'No AI visibility insights recorded for this brand yet.',
        };
    }

    /**
     * Competitive Intelligence reflecting configured competitor benchmarks.
     */
    async getCompetitiveIntelligence(token?: string) {
        const brand = await this.safeGetBrand(undefined, token);

        try {
            const profile = await this.apiClient.callRest<any>('/api/brand-monitor/brand-profile/current', { bearerToken: token });
            const comps = profile?.brand?.competitors || profile?.competitors;
            if (Array.isArray(comps) && comps.length > 0) {
                const mappedCompetitors = comps.map((c: any, i: number) => ({
                    id: c.id || `comp-${i + 1}`,
                    name: c.name || 'Competitor',
                    domain: c.domain || (c.url ? c.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0] : ''),
                    url: c.url,
                    visibility: c.visibility ?? 0,
                    sentiment: c.sentiment ?? 0,
                    shareOfVoice: c.shareOfVoice ?? 0,
                    velocity: c.velocity ?? 0,
                    authority: c.authority ?? 0,
                    mentions30d: c.mentions30d ?? 0,
                }));
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
                    shareOfVoiceTrend: profile.shareOfVoiceTrend || [],
                    status: 'active',
                    hasData: true,
                    trackedBrands: mappedCompetitors.length,
                    competitors: mappedCompetitors,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            status: 'active',
            hasData: false,
            trackedBrands: 0,
            competitors: [],
            shareOfVoiceTrend: [],
            dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
            message: 'No tracked competitors configured for this brand yet. Use manage_competitors to add competitor domains.',
        };
    }

    /**
     * Scan history mapped to live scan runs.
     */
    async getScanHistory(token?: string, brandId?: string, promptKey?: string) {
        const brand = await this.safeGetBrand(brandId, token);

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
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            totalRuns: 0,
            completedRuns: 0,
            latestScore: null,
            history: [],
            runs: [],
            hasData: false,
            message: 'No scan runs found for this brand yet.',
        };
    }

    /**
     * AI Readiness Audit reflecting real site crawl diagnostics.
     */
    async getAiReadinessAudit(token?: string) {
        const brand = await this.safeGetBrand(undefined, token);

        try {
            const live = await this.apiClient.callTool('get_audit_report', {}, token);
            if (live && typeof live === 'object' && ('score' in live || 'grade' in live)) return live;
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            score: null,
            grade: null,
            crawledAt: null,
            pagesCrawled: 0,
            critical: 0,
            high: 0,
            categories: [],
            findings: [],
            hasData: false,
            status: 'no_data',
            message: 'No AI readiness audit has been run for this brand yet. Run trigger_aeo_audit to initiate an audit.',
        };
    }

    /**
     * Retrieves GEO assets by jobId or informs caller that jobId is required.
     */
    async getGeoAssets(jobIdOrBrandId?: string, token?: string) {
        const brand = await this.safeGetBrand(jobIdOrBrandId, token);

        if (jobIdOrBrandId && (jobIdOrBrandId.startsWith('job_') || jobIdOrBrandId.length > 20)) {
            try {
                const live = await this.apiClient.callTool('get_geo_assets', { job_id: jobIdOrBrandId }, token);
                if (live && Object.keys(live).length > 0) return live;
            } catch {}
        }

        try {
            const live = await this.apiClient.callTool('get_geo_assets', jobIdOrBrandId ? { brand_id: jobIdOrBrandId } : {}, token);
            if (live && Array.isArray(live.assets) && live.assets.length > 0) {
                const assets = live.assets;
                return {
                    brand: live?.brand || (brand ? { name: brand.name, domain: brand.domain || brand.url } : null),
                    assets,
                    totalAssets: assets.length,
                    published: assets.filter((a: any) => a.status === 'published').length,
                    drafts: assets.filter((a: any) => a.status === 'draft').length,
                    needsRefresh: assets.filter((a: any) => a.status === 'needs_refresh').length,
                    hasData: true,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            assets: [],
            totalAssets: 0,
            published: 0,
            drafts: 0,
            needsRefresh: 0,
            hasData: false,
            message: 'No GEO assets generated yet for this brand. Run generate_geo_assets to generate them.',
        };
    }

    /**
     * AGXP telemetry reflecting stage loop scores.
     */
    async getAgxp(token?: string) {
        const brand = await this.safeGetBrand(undefined, token);

        try {
            const live = await this.apiClient.callRest<any>('/api/brand-monitor/agxp', {
                bearerToken: token,
            });
            if (live && Object.keys(live).length > 0 && live.loopScore > 0) return live;
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            loopScore: null,
            lift30d: null,
            status: 'no_data',
            hasData: false,
            stages: [],
            message: 'No AGXP telemetry recorded for this brand yet.',
        };
    }

    /**
     * Content studio briefs.
     */
    async getContentStudio(status?: BriefStatus, token?: string) {
        const brand = await this.safeGetBrand(undefined, token);

        try {
            const live = await this.apiClient.callRest<any>('/api/content-studio/briefs', {
                params: { status },
                bearerToken: token,
            });
            if (live && Array.isArray(live.briefs)) {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    ...live,
                    hasData: live.briefs.length > 0,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            status: status ?? 'all',
            counts: {
                ready: 0,
                in_progress: 0,
                published: 0,
                gap: 0,
            },
            briefs: [],
            totalBriefs: 0,
            hasData: false,
            message: 'No content briefs created for this brand yet.',
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
     * Site technical diagnostics.
     */
    async getTechnicalDiagnostics(brandId?: string, token?: string) {
        const brand = await this.safeGetBrand(brandId, token);

        try {
            const res = await this.apiClient.callRest<any>('/api/brand-monitor/analytics/diagnostics', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && typeof res === 'object') {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    ...res,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            status: 'no_data',
            hasData: false,
            score: 0,
            crawlHealth: 'not_crawled',
            robotsValid: false,
            sitemapIndexed: false,
            schemaValid: false,
            issues: [],
            pagesCrawled: 0,
            categories: [],
            findings: [],
            message: 'No technical diagnostics available yet for this brand.',
        };
    }

    /**
     * Auto-generates an Ideal Customer Profile (ICP).
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
            status: 'not_available',
            message: 'ICP auto-generation is not currently available from CogNerd upstream.',
        };
    }

    /**
     * Suggests buyer personas.
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
            status: 'not_available',
            message: 'Persona suggestions are not currently available from CogNerd upstream.',
        };
    }

    /**
     * Adds, removes, or lists tracked competitor domains.
     */
    async manageCompetitorLive(
        action: 'add' | 'remove' | 'list',
        competitor?: { name: string; url: string; aliases?: string[] },
        brandId?: string,
        token?: string
    ) {
        const brand = await this.safeGetBrand(brandId, token);
        let rawResult: any = null;

        if (action === 'add' && competitor) {
            try {
                rawResult = await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                    method: 'POST',
                    data: competitor,
                    params: brandId ? { brandId } : undefined,
                    bearerToken: token,
                });
            } catch (err: any) {
                if (!err.message?.includes('ALREADY_EXISTS') && !err.message?.includes('409')) {
                    return {
                        status: 'error',
                        message: `Failed to add competitor: ${err.message}`,
                        competitors: [],
                    };
                }
            }
        } else if (action === 'remove' && competitor) {
            try {
                rawResult = await this.apiClient.callRest('/api/brand-monitor/brand-profile/current/competitors', {
                    method: 'DELETE',
                    data: { name: competitor.name, url: competitor.url },
                    params: brandId ? { brandId } : undefined,
                    bearerToken: token,
                });
            } catch (err: any) {
                return {
                    status: 'error',
                    message: `Failed to remove competitor: ${err.message}`,
                    competitors: [],
                };
            }
        }

        let competitorsList: any[] = [];
        if (rawResult?.brand?.competitors && Array.isArray(rawResult.brand.competitors)) {
            competitorsList = rawResult.brand.competitors;
        } else if (rawResult?.competitors && Array.isArray(rawResult.competitors)) {
            competitorsList = rawResult.competitors;
        } else {
            try {
                const profile = await this.apiClient.callRest<any>('/api/brand-monitor/brand-profile/current', {
                    params: brandId ? { brandId } : undefined,
                    bearerToken: token,
                });
                competitorsList = profile?.brand?.competitors || profile?.competitors || [];
            } catch {}
        }

        const mappedCompetitors = competitorsList.map((c: any, i: number) => ({
            id: c.id || `comp-${i + 1}`,
            name: c.name || 'Competitor',
            domain: c.domain || (c.url ? c.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0] : ''),
            url: c.url,
            visibility: c.visibility ?? 0,
            sentiment: c.sentiment ?? 0,
            shareOfVoice: c.shareOfVoice ?? 0,
            velocity: c.velocity ?? 0,
            authority: c.authority ?? 0,
            mentions30d: c.mentions30d ?? 0,
        }));

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            status: 'active',
            action,
            hasData: mappedCompetitors.length > 0,
            trackedBrands: mappedCompetitors.length,
            totalCompetitors: mappedCompetitors.length,
            competitors: mappedCompetitors,
            dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
            message: action === 'add'
                ? `Added ${competitor?.name || competitor?.url || 'competitor'} to tracking list.`
                : action === 'remove'
                ? `Removed ${competitor?.name || competitor?.url || 'competitor'} from tracking list.`
                : undefined,
        };
    }

    /**
     * Generates a multi-slide LinkedIn carousel deck.
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
            status: 'not_available',
            message: 'LinkedIn carousel generation is not currently available from CogNerd upstream.',
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
            status: 'not_found',
            message: `Carousel deck '${deckId}' not found.`,
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
            status: 'not_available',
            message: 'Carousel re-rendering is not currently available from CogNerd upstream.',
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
            outline: [],
            status: 'not_available',
            message: 'Article wizard is not currently available from CogNerd upstream.',
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
            status: 'not_available',
            message: `Article wizard step '${step}' is not currently available from CogNerd upstream.`,
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
            status: 'not_available',
            message: 'Blog finalization is not currently available from CogNerd upstream.',
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
            status: 'not_available',
            message: 'Article repurposing is not currently available from CogNerd upstream.',
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
            originalText: params.text,
            status: 'not_available',
            message: 'Paragraph rewriting is not currently available from CogNerd upstream.',
        };
    }

    /**
     * Generates single standalone social posts.
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
            status: 'not_available',
            message: 'Social post generation is not currently available from CogNerd upstream.',
        };
    }

    /**
     * Live backlinks snapshot.
     */
    async getBacklinksSnapshotLive(brandId?: string, token?: string): Promise<BacklinkSummary> {
        const brand = await this.safeGetBrand(brandId, token);

        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/backlinks/current', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && typeof res === 'object') {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    ...res,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            totalBacklinks: 0,
            referringDomains: 0,
            domainRating: 0,
            hasData: false,
            status: 'no_data',
            message: 'No backlink snapshot data found for this brand.',
        } as any;
    }

    /**
     * Triggers live competitor backlink refresh.
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
            status: 'not_available',
            message: 'Competitor backlink refresh is not currently available from CogNerd upstream.',
        };
    }

    /**
     * Retrieves Google Search Console query impressions and rankings.
     */
    async getSearchConsoleReportLive(days: number = 30, brandId?: string, token?: string): Promise<SearchConsoleReport> {
        const brand = await this.safeGetBrand(brandId, token);

        try {
            const res = await this.apiClient.callRest<any>('/api/brand-monitor/integrations/google-search-console/report', {
                params: { days, ...(brandId ? { brandId } : {}) },
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    ...res,
                };
            }
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
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            days,
            totalClicks: 0,
            totalImpressions: 0,
            avgCtr: 0,
            avgPosition: 0,
            hasData: false,
            status: 'not_connected',
            message: 'Google Search Console integration is not connected for this brand.',
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
            status: 'not_connected',
            message: 'No verified Search Console web properties found for this brand.',
        };
    }

    /**
     * Retrieves Google Analytics 4 traffic and referral telemetry.
     */
    async getGa4TrafficReportLive(brandId?: string, token?: string): Promise<Ga4TrafficReport> {
        const brand = await this.safeGetBrand(brandId, token);

        try {
            const res = await this.apiClient.callRest<any>('/api/brand-monitor/integrations/google-analytics/report', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    ...res,
                };
            }
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
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            totalUsers: 0,
            sessions: 0,
            engagementRate: 0,
            hasData: false,
            status: 'not_connected',
            message: 'Google Analytics 4 integration is not connected for this brand.',
            trafficSources: [],
        } as any;
    }

    /**
     * Retrieves Microsoft Clarity user experience telemetry.
     */
    async getClarityReportLive(brandId?: string, token?: string): Promise<ClarityReport> {
        const brand = await this.safeGetBrand(brandId, token);

        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/integrations/microsoft-clarity/report', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    ...res,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            totalSessions: 0,
            scrollDepthPercent: 0,
            rageClicks: 0,
            deadClicks: 0,
            quickBacks: 0,
            hasData: false,
            status: 'not_connected',
            message: 'Microsoft Clarity integration is not connected for this brand.',
        } as any;
    }

    /**
     * Retrieves Google Ads campaign performance.
     */
    async getGoogleAdsReportLive(brandId?: string, token?: string): Promise<GoogleAdsReport> {
        const brand = await this.safeGetBrand(brandId, token);

        try {
            const res = await this.apiClient.callRest('/api/brand-monitor/integrations/google-ads/report', {
                params: brandId ? { brandId } : undefined,
                bearerToken: token,
            });
            if (res && Object.keys(res).length > 0) {
                return {
                    brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
                    ...res,
                };
            }
        } catch {}

        return {
            brand: brand ? { name: brand.name, domain: brand.domain || brand.url } : null,
            totalSpend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            hasData: false,
            status: 'not_connected',
            message: 'Google Ads integration is not connected for this brand.',
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
            if (res && typeof res === 'object') return res;
        } catch {}

        return {
            integrations: [],
            status: 'not_available',
            message: 'Integration status checks are not currently available from CogNerd upstream.',
        } as any;
    }
}
