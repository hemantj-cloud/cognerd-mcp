export type Engine =
    | 'ChatGPT'
    | 'Perplexity'
    | 'Gemini'
    | 'Claude'
    | 'AI Overviews'
    | 'Copilot'
    | 'Grok';

export type Sentiment = 'positive' | 'neutral' | 'negative';
export type MentionType = 'explicit' | 'implicit' | 'citation';
export type ScanStatus = 'completed' | 'running' | 'failed' | 'queued';
export type PromptStatus = 'new' | 'active' | 'archived';
export type AssetStatus = 'published' | 'draft' | 'needs_refresh';
export type BriefStatus = 'ready' | 'in_progress' | 'published' | 'gap';

// NOTE: data shapes are `type` aliases (not `interface`) so they receive implicit
// index signatures and remain assignable to the framework's JsonValue/ExampleData.
export type Brand = {
    id: string;
    name: string;
    domain: string;
    industry: string;
    workspace: string;
    description: string;
    credits: number;
};

export type IcpInputs = {
    teamSize: string;
    budget: string;
    salesCycle: string;
    mustHaveTraits: string;
};

export type Persona = {
    id: string;
    initials: string;
    name: string;
    title: string;
    location: string;
    summary: string;
    painPoints: string[];
    goals: string[];
    promptsSeeded: number;
};

export type PromptRecord = {
    id: string;
    text: string;
    status: PromptStatus;
    personaId: string;
    personaName: string;
    intent: string;
    engines: Engine[];
    mentionRate: number;
    createdAt: string;
};

export type VisibilityRow = {
    id: string;
    prompt: string;
    engine: Engine;
    mentioned: boolean;
    cited: boolean;
    position: number | null;
    mentions: number;
    sources: string[];
    createdAt: string;
    sentiment: Sentiment;
};

export type CitationRecord = {
    id: string;
    engine: Engine;
    sourceDomain: string;
    sourceUrl: string;
    owned: boolean;
    prompt: string;
    snippet: string;
    date: string;
};

export type TimeSeriesPoint = {
    date: string;
    score: number;
    mentions: number;
    citations: number;
};

export type ProviderBreakdown = {
    engine: Engine;
    mentions: number;
    citations: number;
    share: number;
};

export type Competitor = {
    id: string;
    name: string;
    domain: string;
    visibility: number;
    sentiment: number;
    shareOfVoice: number;
    velocity: number;
    authority: number;
    mentions30d: number;
};

export type ScanRun = {
    id: string;
    label: string;
    status: ScanStatus;
    startedAt: string;
    completedAt: string | null;
    promptsRun: number;
    mentions: number;
    citations: number;
    visibilityScore: number;
    engines: Engine[];
    delta: number;
};

export type AuditFinding = {
    id: string;
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    recommendation: string;
    scoreImpact: number;
};

export type GeoAsset = {
    id: string;
    name: string;
    kind: 'llms.txt' | 'schema' | 'robots' | 'entity' | 'faq' | 'sitemap';
    status: AssetStatus;
    path: string;
    updatedAt: string;
    citationLift: string;
    summary: string;
};

export type AgxpStage = {
    id: string;
    name: string;
    description: string;
    score: number;
    status: 'healthy' | 'watch' | 'gap';
    signals: string[];
};

export type ContentBrief = {
    id: string;
    title: string;
    status: BriefStatus;
    targetPrompt: string;
    gapScore: number;
    estimatedCitationLift: string;
    wordCount: number;
    persona: string;
    outline: string[];
    updatedAt: string;
};

export type GeoAssetJobResult = {
    jobId: string;
    brandId: string;
    status: 'completed' | 'queued' | 'running' | 'failed';
    assets: GeoAsset[];
    totalAssets: number;
    downloadUrl?: string;
    summary?: string;
    message?: string;
};

export type AeoAuditReport = {
    brand: Brand;
    score: number;
    grade: string;
    crawledAt: string;
    pagesCrawled: number;
    categories: Array<{ name: string; score: number }>;
    findings: AuditFinding[];
    critical: number;
    high: number;
    status?: string;
    jobId?: string;
};

export type SiteDiagnostics = {
    brand: Brand;
    domain: string;
    status: 'healthy' | 'warning' | 'error';
    crawlability: {
        robotsTxt: boolean;
        sitemapXml: boolean;
        llmsTxt: boolean;
        schemaOrgDetected: boolean;
    };
    aiEngineAccess: {
        gptBot: boolean;
        claudeBot: boolean;
        perplexityBot: boolean;
        googleOther: boolean;
    };
    latencyMs: number;
    lastChecked: string;
    issues: string[];
};

export type IcpGenerationResult = {
    brand: Brand;
    icp: IcpInputs;
    personas: Persona[];
    suggestedTopics: string[];
    creditsDeducted?: number;
    status: 'success' | 'queued';
};

export type CompetitorOperationResult = {
    brandId: string;
    action: 'added' | 'removed' | 'list';
    competitor: {
        name: string;
        url: string;
        aliases?: string[];
    };
    totalCompetitors: number;
    competitors: Array<{ name: string; url: string; aliases?: string[] }>;
};

export type CarouselSlide = {
    slideNumber: number;
    headline: string;
    body: string;
    callout?: string;
    visualCue?: string;
    bulletPoints?: string[];
};

export type CarouselDeck = {
    id: string;
    brandId: string;
    topic: string;
    title: string;
    targetAudience: string;
    theme: 'minimal' | 'bold' | 'dark' | 'corporate';
    slideCount: number;
    slides: CarouselSlide[];
    status: 'draft' | 'rendered' | 'published';
    creditsDeducted: number;
    createdAt: string;
    previewUrl?: string;
};

export type ArticleWizardProject = {
    id: string;
    brandId: string;
    title: string;
    targetPrompt: string;
    status: 'draft' | 'research' | 'writing' | 'firewall_passed' | 'finalized';
    currentStep: 'outline' | 'research' | 'draft' | 'firewall' | 'finalize';
    outline: string[];
    researchFacts: Array<{ claim: string; sourceUrl: string; confidence: number }>;
    contentMarkdown: string;
    wordCount: number;
    citationsIncluded: number;
    heroImageUrl?: string;
    creditsReserved: number;
    updatedAt: string;
};

export type SocialRepurposeBundle = {
    projectId?: string;
    topic: string;
    linkedin: {
        postText: string;
        hashtags: string[];
        hook: string;
    };
    twitter: {
        thread: string[];
        hashtags: string[];
    };
    keyTakeaways: string[];
    generatedAt: string;
};

export type RewriteParagraphResult = {
    originalText: string;
    rewrittenText: string;
    focusIntent: string;
    estimatedCitationLift: string;
    improvements: string[];
};

export type BacklinkSummary = {
    brandId: string;
    brandDomain: string;
    totalBacklinks: number;
    referringDomains: number;
    domainRank: number;
    competitors: Array<{
        domain: string;
        backlinks: number;
        referringDomains: number;
        relativeStrength: string;
    }>;
    aiCitationCorrelation: {
        backlinkAuthorityScore: number;
        citationCoverageRate: number;
        verdict: string;
    };
    updatedAt: string;
};

export type SearchConsoleReport = {
    connected: boolean;
    siteUrl: string;
    days: number;
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
    topQueries: Array<{
        query: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
    }>;
    updatedAt: string;
};

export type Ga4TrafficReport = {
    connected: boolean;
    propertyId: string;
    totalUsers: number;
    sessions: number;
    engagementRate: number;
    conversions: number;
    channels: Array<{
        channel: string;
        sessions: number;
        share: number;
    }>;
    updatedAt: string;
};

export type ClarityReport = {
    connected: boolean;
    projectId: string;
    totalSessions: number;
    pagesPerSession: number;
    scrollDepthPercent: number;
    deadClickRate: number;
    rageClickRate: number;
    quickBackRate: number;
    updatedAt: string;
};

export type GoogleAdsReport = {
    connected: boolean;
    currency: string;
    totalSpend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    costPerConversion: number;
    campaignsCount: number;
    updatedAt: string;
};

export type ToolkitStatus = {
    toolkit: string;
    name: string;
    category: string;
    connected: boolean;
    authType: string;
    lastSyncedAt?: string;
    destinationConfigured?: boolean;
};

export type IntegrationsStatus = {
    brandId: string;
    totalToolkits: number;
    connectedCount: number;
    toolkits: ToolkitStatus[];
};



