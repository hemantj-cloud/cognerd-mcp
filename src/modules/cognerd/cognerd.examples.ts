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
        user: { id: 'usr_123', name: 'User Name', email: 'user@example.com' },
        brands: [{ id: 'br_123', name: 'Brand Name', url: 'https://example.com' }],
        scopes: ['cognerd'],
        credits: { balance: 100, reserved: 0, draftArticleCost: 30 },
    },
};

export const CREDIT_BALANCE_EXAMPLE = {
    request: {},
    response: {
        balance: 100,
        reserved: 0,
        draftArticleCost: 30,
    },
};
