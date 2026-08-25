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
