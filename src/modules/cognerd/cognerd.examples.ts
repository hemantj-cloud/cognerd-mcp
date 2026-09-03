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

export const AI_INSIGHTS_EXAMPLE = {
    request: {},
    response: {
        brand: BRAND,
        metrics: {
            visibilityScore: TREND[TREND.length - 1].score,
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
    },
};

export const AUDIENCE_PERSONAS_EXAMPLE = {
    request: {},
    response: {
        brand: BRAND,
        icp: ICP_INPUTS,
        personas: PERSONAS,
        totalPersonas: PERSONAS.length,
    },
};

export const PROMPT_INTELLIGENCE_EXAMPLE = {
    request: { status: 'active' as const },
    response: {
        brand: BRAND,
        status: 'active',
        counts: {
            new: PROMPTS.filter((p) => p.status === 'new').length,
            active: PROMPTS.filter((p) => p.status === 'active').length,
            archived: PROMPTS.filter((p) => p.status === 'archived').length,
        },
        prompts: filterPrompts('active'),
        totalPrompts: filterPrompts('active').length,
    },
};

export const AI_VISIBILITY_EXAMPLE = {
    request: { mentioned: 'mentioned' as const },
    response: {
        brand: BRAND,
        metrics: {
            trackedPrompts: 24,
            mentionedIn: 18,
            mentionRate: 0.75,
            trendingUp: 8,
            avgPosition: 2.4,
        },
        filters: {
            engine: 'all',
            mentioned: 'mentioned',
        },
        rows: filterVisibility({ mentioned: 'mentioned' }),
        totalRows: filterVisibility({ mentioned: 'mentioned' }).length,
    },
};

export const CITATIONS_EXAMPLE = {
    request: { engine: 'Perplexity' as const },
    response: {
        brand: BRAND,
        metrics: {
            totalCitations: 317,
            sourceDomains: 78,
            ownedCitations: 129,
            citationCoverage: 0.247,
            ownedShare: 0.407,
        },
        engine: 'Perplexity',
        trend: TREND.map((p) => ({ date: p.date, citations: p.citations })),
        byEngine: PROVIDERS.map((p) => ({ engine: p.engine, citations: p.citations, mentions: p.mentions })),
        citations: filterCitations('Perplexity'),
        totalCitations: filterCitations('Perplexity').length,
    },
};

export const COMPETITIVE_INTELLIGENCE_EXAMPLE = {
    request: {},
    response: {
        brand: BRAND,
        you: COMPETITORS[0],
        competitors: COMPETITORS,
        dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
        shareOfVoiceTrend: SOV_TREND,
        trackedBrands: COMPETITORS.length,
    },
};

export const SCAN_HISTORY_EXAMPLE = {
    request: {},
    response: {
        brand: BRAND,
        runs: SCAN_RUNS,
        totalRuns: SCAN_RUNS.length,
        completedRuns: SCAN_RUNS.filter((r) => r.status === 'completed').length,
        latestScore: 82,
    },
};

export const AI_READINESS_AUDIT_EXAMPLE = {
    request: {},
    response: {
        brand: BRAND,
        score: 76,
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
    },
};

export const GEO_ASSETS_EXAMPLE = {
    request: {},
    response: {
        brand: BRAND,
        assets: GEO_ASSETS,
        totalAssets: GEO_ASSETS.length,
        published: GEO_ASSETS.filter((a) => a.status === 'published').length,
        drafts: GEO_ASSETS.filter((a) => a.status === 'draft').length,
        needsRefresh: GEO_ASSETS.filter((a) => a.status === 'needs_refresh').length,
    },
};

export const AGXP_EXAMPLE = {
    request: {},
    response: {
        brand: BRAND,
        loopScore: 78,
        stages: AGXP_STAGES,
        lift30d: '+12.4% visibility · +21.6% citations',
    },
};

export const CONTENT_STUDIO_EXAMPLE = {
    request: { status: 'gap' as const },
    response: {
        brand: BRAND,
        status: 'gap',
        counts: {
            ready: CONTENT_BRIEFS.filter((b) => b.status === 'ready').length,
            in_progress: CONTENT_BRIEFS.filter((b) => b.status === 'in_progress').length,
            published: CONTENT_BRIEFS.filter((b) => b.status === 'published').length,
            gap: CONTENT_BRIEFS.filter((b) => b.status === 'gap').length,
        },
        briefs: filterBriefs('gap'),
        totalBriefs: filterBriefs('gap').length,
    },
};
