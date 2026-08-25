import { Injectable } from '@nitrostack/core';
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
import type { BriefStatus, Engine } from './cognerd.types.js';

@Injectable()
export class CognerdService {
    getBrand() {
        return BRAND;
    }

    getAudiencePersonas() {
        return {
            brand: BRAND,
            icp: ICP_INPUTS,
            personas: PERSONAS,
            totalPersonas: PERSONAS.length,
        };
    }

    getPromptIntelligence(status?: 'new' | 'active' | 'archived') {
        const prompts = filterPrompts(status);
        return {
            brand: BRAND,
            status: status ?? 'all',
            counts: {
                new: PROMPTS.filter((p) => p.status === 'new').length,
                active: PROMPTS.filter((p) => p.status === 'active').length,
                archived: PROMPTS.filter((p) => p.status === 'archived').length,
            },
            prompts,
            totalPrompts: prompts.length,
        };
    }

    getAiVisibility(filters: {
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

    getCitations(engine?: Engine | 'all') {
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

    getAiInsights() {
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

    getCompetitiveIntelligence() {
        return {
            brand: BRAND,
            you: COMPETITORS[0],
            competitors: COMPETITORS,
            dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
            shareOfVoiceTrend: SOV_TREND,
            trackedBrands: COMPETITORS.length,
        };
    }

    getScanHistory() {
        const completed = SCAN_RUNS.filter((r) => r.status === 'completed');
        return {
            brand: BRAND,
            runs: SCAN_RUNS,
            totalRuns: SCAN_RUNS.length,
            completedRuns: completed.length,
            latestScore: completed[0]?.visibilityScore ?? null,
        };
    }

    getAiReadinessAudit() {
        const base = 76;
        return {
            brand: BRAND,
            score: base,
            grade: 'B',
            crawledAt: '2026-08-23T11:40:00.000Z',
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
        };
    }

    getGeoAssets() {
        return {
            brand: BRAND,
            assets: GEO_ASSETS,
            totalAssets: GEO_ASSETS.length,
            published: GEO_ASSETS.filter((a) => a.status === 'published').length,
            drafts: GEO_ASSETS.filter((a) => a.status === 'draft').length,
            needsRefresh: GEO_ASSETS.filter((a) => a.status === 'needs_refresh').length,
        };
    }

    getAgxp() {
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

    getContentStudio(status?: BriefStatus) {
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
