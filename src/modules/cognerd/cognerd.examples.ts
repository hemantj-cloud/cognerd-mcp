/**
 * CogNerd Tool Schema Examples
 * Static structure examples used purely for MCP tool discovery documentation.
 */

export const AI_INSIGHTS_EXAMPLE = {
    request: {},
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        metrics: {
            visibilityScore: 85.0,
            visibilityDelta: 5.2,
            totalMentions: 120,
            organicMentions: 90,
            seededMentions: 30,
            explicitMentions: 50,
            citations: 25,
            dropsDetected: 0,
        },
        trend: [],
        byProvider: [],
        recentMentions: [],
    },
};

export const AUDIENCE_PERSONAS_EXAMPLE = {
    request: {},
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        icp: {
            teamSize: '10-50',
            budget: '$20k-50k',
            salesCycle: '30 days',
            mustHaveTraits: 'Cloud-native',
        },
        personas: [],
        totalPersonas: 0,
    },
};

export const PROMPT_INTELLIGENCE_EXAMPLE = {
    request: { status: 'active' as const },
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        status: 'active',
        counts: { new: 0, active: 0, archived: 0 },
        prompts: [],
        totalPrompts: 0,
    },
};

export const AI_VISIBILITY_EXAMPLE = {
    request: { engine: 'ChatGPT' as const, mentioned: 'mentioned' as const },
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        metrics: {
            trackedPrompts: 0,
            mentionedIn: 0,
            mentionRate: 0,
            trendingUp: 0,
            avgPosition: null,
        },
        filters: { engine: 'ChatGPT', mentioned: 'mentioned' },
        rows: [],
        totalRows: 0,
    },
};

export const CITATIONS_EXAMPLE = {
    request: { engine: 'all' as const },
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        metrics: {
            totalCitations: 0,
            sourceDomains: 0,
            ownedCitations: 0,
            citationCoverage: 0,
            ownedShare: 0,
        },
        engine: 'all',
        trend: [],
        byEngine: [],
        citations: [],
        totalCitations: 0,
    },
};

export const COMPETITIVE_INTELLIGENCE_EXAMPLE = {
    request: {},
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        competitors: [],
        dimensions: ['visibility', 'sentiment', 'share', 'velocity', 'authority'],
        trackedBrands: 0,
    },
};

export const SCAN_HISTORY_EXAMPLE = {
    request: {},
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        history: [],
        totalRuns: 0,
    },
};

export const AI_READINESS_AUDIT_EXAMPLE = {
    request: {},
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        score: 0,
        grade: 'N/A',
        findings: [],
        totalFindings: 0,
        highSeverity: 0,
    },
};

export const GEO_ASSETS_EXAMPLE = {
    request: {},
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        assets: [],
        totalAssets: 0,
        published: 0,
        drafts: 0,
        needsRefresh: 0,
    },
};

export const AGXP_EXAMPLE = {
    request: {},
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        loopScore: 0,
        stages: [],
        lift30d: '0%',
    },
};

export const CONTENT_STUDIO_EXAMPLE = {
    request: { status: 'ready' as const },
    response: {
        brand: { name: 'Brand Name', domain: 'example.com' },
        status: 'ready',
        counts: { ready: 0, in_progress: 0, published: 0, gap: 0 },
        briefs: [],
        totalBriefs: 0,
    },
};

export const WHOAMI_EXAMPLE = {
    request: {},
    response: {
        user: { id: 'usr_144', name: 'NitroStack Partner', email: 'hub+nitrostack@cognerd.ai' },
        brands: [{ id: '809461f0-a5f8-4e7b-8523-9f52c7703553', name: 'NitroStack', url: 'https://nitrostack.ai' }],
        scopes: ['cognerd'],
        plan: { code: 'partner', name: 'Partner' },
        allowances: {
            'runs.monthly': { enabled: true, used: 4, limit: 15, remaining: 11 },
            'briefs.blog.monthly': { enabled: true, used: 5, limit: 50, remaining: 45 },
            'briefs.linkedin.monthly': { enabled: true, used: 12, limit: 50, remaining: 38 },
            'briefs.x.monthly': { enabled: true, used: 8, limit: 50, remaining: 42 },
            'tools.aeo_audit.daily': { enabled: true, used: 1, limit: 5, remaining: 4 },
            'tools.geo_assets.daily': { enabled: true, used: 0, limit: 5, remaining: 5 },
            'brands.max': { enabled: true, used: 1, limit: 10, remaining: 9 },
        },
        runs: { used: 4, limit: 15, remaining: 11 },
    },
};

export const RUN_ALLOWANCE_EXAMPLE = {
    request: {},
    response: {
        plan: { code: 'partner', name: 'Partner' },
        allowances: {
            'runs.monthly': {
                enabled: true,
                used: 4,
                limit: 15,
                remaining: 11,
                periodStart: '2026-10-01T00:00:00Z',
                periodEnd: '2026-11-01T00:00:00Z',
            },
            'briefs.blog.monthly': { enabled: true, used: 5, limit: 50, remaining: 45 },
            'briefs.linkedin.monthly': { enabled: true, used: 12, limit: 50, remaining: 38 },
            'briefs.x.monthly': { enabled: true, used: 8, limit: 50, remaining: 42 },
            'tools.aeo_audit.daily': { enabled: true, used: 1, limit: 5, remaining: 4 },
            'tools.geo_assets.daily': { enabled: true, used: 0, limit: 5, remaining: 5 },
            'tools.llm_generation.daily': { enabled: true, used: 2, limit: 5, remaining: 3 },
            'tools.carousel.daily': { enabled: true, used: 0, limit: 5, remaining: 5 },
            'brands.max': { enabled: true, used: 1, limit: 10, remaining: 9 },
        },
    },
};

/** @deprecated Legacy compatibility alias for RUN_ALLOWANCE_EXAMPLE */
export const CREDIT_BALANCE_EXAMPLE = RUN_ALLOWANCE_EXAMPLE;

