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
import type { Brand, BriefStatus, Engine } from './cognerd.types.js';

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
}
