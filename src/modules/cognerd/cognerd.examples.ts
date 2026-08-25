import { CognerdService } from './cognerd.service.js';

const service = new CognerdService();

export const AI_INSIGHTS_EXAMPLE = {
    request: {},
    response: service.getAiInsights(),
};

export const AUDIENCE_PERSONAS_EXAMPLE = {
    request: {},
    response: service.getAudiencePersonas(),
};

export const PROMPT_INTELLIGENCE_EXAMPLE = {
    request: { status: 'active' as const },
    response: service.getPromptIntelligence('active'),
};

export const AI_VISIBILITY_EXAMPLE = {
    request: { mentioned: 'mentioned' as const },
    response: service.getAiVisibility({ mentioned: 'mentioned' }),
};

export const CITATIONS_EXAMPLE = {
    request: { engine: 'Perplexity' as const },
    response: service.getCitations('Perplexity'),
};

export const COMPETITIVE_INTELLIGENCE_EXAMPLE = {
    request: {},
    response: service.getCompetitiveIntelligence(),
};

export const SCAN_HISTORY_EXAMPLE = {
    request: {},
    response: service.getScanHistory(),
};

export const AI_READINESS_AUDIT_EXAMPLE = {
    request: {},
    response: service.getAiReadinessAudit(),
};

export const GEO_ASSETS_EXAMPLE = {
    request: {},
    response: service.getGeoAssets(),
};

export const AGXP_EXAMPLE = {
    request: {},
    response: service.getAgxp(),
};

export const CONTENT_STUDIO_EXAMPLE = {
    request: { status: 'gap' as const },
    response: service.getContentStudio('gap'),
};
