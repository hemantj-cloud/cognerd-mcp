import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CognerdService } from '../src/modules/cognerd/cognerd.service.js';
import { CognerdApiClient } from '../src/services/cognerd-api.client.js';
import { OAuthService } from '../src/services/oauth.service.js';

describe('CogNerd Service & Tools Live Integration Tests', { timeout: 15000 }, () => {
  let oauthService: OAuthService;
  let apiClient: CognerdApiClient;
  let service: CognerdService;

  beforeEach(() => {
    oauthService = new OAuthService();
    apiClient = new CognerdApiClient(oauthService);
    service = new CognerdService(apiClient);

    // Default test-level mock responses mimicking live upstream CogNerd API responses
    vi.spyOn(apiClient, 'callTool').mockImplementation(async (toolName: string) => {
      switch (toolName) {
        case 'get_brand_context':
          return {
            brand: {
              id: 'br_live_123',
              name: 'Live Brand',
              domain: 'livebrand.ai',
              industry: 'AI Software',
              workspace: 'Live Brand Workspace',
              description: 'Live Brand Description',
              credits: 500,
            },
            personas: [{ id: 'p1', name: 'Buyer Persona 1' }],
          };
        case 'whoami':
          return {
            user: { id: 'usr_live_1', name: 'Live User', email: 'user@livebrand.ai' },
            brands: [{ id: 'br_live_123', name: 'Live Brand', url: 'https://livebrand.ai' }],
            scopes: ['cognerd'],
            credits: { balance: 450, reserved: 0, draftArticleCost: 30 },
          };
        case 'get_credit_balance':
          return { balance: 450, reserved: 0, draftArticleCost: 30 };
        case 'get_weak_prompts':
          return {
            brand: { name: 'Live Brand' },
            prompts: [
              { id: 'p1', promptText: 'Best AI tool', status: 'new', providers: ['ChatGPT'], volumeScore: 80 },
              { id: 'p2', promptText: 'AI tool alternatives', status: 'active', providers: ['Claude'], volumeScore: 70 },
            ],
          };
        case 'get_brand_history':
          return {
            brand: { name: 'Live Brand' },
            history: [{ id: 'run-1', status: 'completed' }],
            totalRuns: 1,
          };
        case 'get_audit_report':
          return {
            score: 82,
            grade: 'A',
            crawledAt: new Date().toISOString(),
            findings: [{ id: 'f1', title: 'Add schema' }],
          };
        case 'get_geo_assets':
          return {
            assets: [{ name: 'llms.txt', status: 'published' }],
          };
        case 'generate_geo_assets':
          return {
            jobId: 'geo-job-1',
            status: 'completed',
            assets: [{ name: 'llms.txt' }],
          };
        case 'run_aeo_audit':
          return {
            jobId: 'aeo-job-1',
            score: 79,
            findings: [{ id: 'f1' }],
          };
        default:
          return {};
      }
    });

    vi.spyOn(apiClient, 'callRest').mockImplementation(async (endpoint: string, options: any = {}) => {
      if (endpoint.includes('/api/brand-monitor/analytics/visibility')) {
        return {
          brand: { name: 'Live Brand' },
          metrics: { trackedPrompts: 10, mentionedIn: 8, mentionRate: 0.8, trendingUp: 2, avgPosition: 2.1 },
          filters: options.params || { engine: 'all', mentioned: 'all' },
          rows: [{ id: 'r1', prompt: 'Best AI', engine: 'ChatGPT', mentioned: true }],
          totalRows: 1,
        };
      }
      if (endpoint.includes('/api/brand-monitor/analytics/citations')) {
        return {
          brand: { name: 'Live Brand' },
          metrics: { totalCitations: 20, sourceDomains: 10, ownedCitations: 5, citationCoverage: 0.5, ownedShare: 0.25 },
          engine: options.params?.engine || 'all',
          trend: [],
          byEngine: [],
          citations: [{ id: 'c1', engine: 'ChatGPT' }],
          totalCitations: 1,
        };
      }
      if (endpoint.includes('/api/brand-monitor/analytics/insights')) {
        return {
          brand: { name: 'Live Brand' },
          metrics: { visibilityScore: 85, visibilityDelta: 10, totalMentions: 100, organicMentions: 80, seededMentions: 20, explicitMentions: 50, citations: 30, dropsDetected: 0 },
          trend: [],
          byProvider: [],
          recentMentions: [],
        };
      }
      if (endpoint.includes('/api/brand-monitor/agxp')) {
        return {
          brand: { name: 'Live Brand' },
          loopScore: 88,
          stages: [{ name: 'Presence', score: 85 }],
          lift30d: '+15%',
        };
      }
      if (endpoint.includes('/api/aeo-audit/fetch')) {
        return { score: 85, grade: 'A', crawledAt: new Date().toISOString(), findings: [{ id: 'f1' }] };
      }
      if (endpoint.includes('/api/brand-monitor/analytics/diagnostics')) {
        return {
          status: 'healthy',
          crawlability: { llmsTxt: true, sitemapXml: true, robotsTxt: true },
          aiEngineAccess: { gptBot: true, claudeBot: true },
        };
      }
      if (endpoint.includes('/api/brand-monitor/audience/icp')) {
        return {
          icp: { target: 'CTOs' },
          personas: [{ id: 'p1', title: 'Tech Lead' }],
          creditsDeducted: 6,
        };
      }
      if (endpoint.includes('/api/brand-monitor/brand-profile/suggest-personas')) {
        return {
          personas: [{ role: 'Lead Architect', name: 'Alex' }],
          totalSuggested: 1,
        };
      }
      if (endpoint.includes('/api/brand-monitor/brand-profile/current/competitors')) {
        return {
          action: 'list',
          totalCompetitors: 2,
          competitors: [{ name: 'Competitor A' }, { name: 'Competitor B' }],
        };
      }
      if (endpoint === '/api/carousel') {
        return {
          id: 'deck-1',
          slides: [{ slideNumber: 1, headline: 'Slide 1' }],
          creditsDeducted: 15,
        };
      }
      if (endpoint.includes('/api/carousel/')) {
        if (endpoint.endsWith('/rerender')) {
          return { id: 'deck-1', status: 'rendered' };
        }
        return { id: 'deck-1', title: 'Carousel Deck', slides: [{ slideNumber: 1 }] };
      }
      if (endpoint === '/api/content-studio/wizard/projects') {
        return { id: 'proj-1', outline: ['Section 1'], creditsReserved: 30 };
      }
      if (endpoint.includes('/api/content-studio/wizard/projects/')) {
        if (endpoint.endsWith('/finalize')) {
          return { projectId: 'proj-1', status: 'published' };
        }
        if (endpoint.includes('/repurpose')) {
          return {
            topic: 'AI Article',
            linkedin: { postText: 'LinkedIn copy' },
            twitter: { thread: ['Tweet 1', 'Tweet 2'] },
          };
        }
        return { projectId: 'proj-1', stepCompleted: 'research', status: 'success' };
      }
      if (endpoint.includes('/api/content-studio/wizard/rewrite')) {
        return { rewrittenText: 'Optimized copy', improvements: ['Grounded in sources'] };
      }
      if (endpoint.includes('/api/content-studio/wizard/generate-social')) {
        return { topic: options.data?.prompt || 'Topic', content: 'Social post' };
      }
      if (endpoint.includes('/api/brand-monitor/backlinks/current')) {
        return {
          totalBacklinks: 120,
          referringDomains: 45,
          competitors: [{ name: 'Comp A' }],
          aiCitationCorrelation: 0.85,
        };
      }
      if (endpoint.includes('/api/brand-monitor/backlinks/refresh')) {
        return { status: 'refreshed', creditsDeducted: 15, competitorsCrawled: 3 };
      }
      if (endpoint.includes('/api/brand-monitor/integrations/google-search-console/report')) {
        return { totalClicks: 320, totalImpressions: 4500, topQueries: [{ query: 'best mcp', clicks: 120 }] };
      }
      if (endpoint.includes('/api/brand-monitor/integrations/google-search-console/sites')) {
        return [{ siteUrl: 'https://livebrand.ai' }];
      }
      if (endpoint.includes('/api/brand-monitor/integrations/google-analytics/report')) {
        return { totalUsers: 1400, sessions: 2100, channels: [{ channel: 'Organic', users: 900 }] };
      }
      if (endpoint.includes('/api/brand-monitor/integrations/microsoft-clarity/report')) {
        return { totalSessions: 800, scrollDepthPercent: 72 };
      }
      if (endpoint.includes('/api/brand-monitor/integrations/google-ads/report')) {
        return { totalSpend: 1500, conversions: 45 };
      }
      if (endpoint.includes('/api/brand-monitor/integrations')) {
        return { totalToolkits: 6, connectedCount: 4 };
      }
      return {};
    });
  });

  it('should return brand profile from live context', async () => {
    const brand = await service.getBrand();
    expect(brand.name).toBe('Live Brand');
    expect(brand.domain).toBe('livebrand.ai');
  });

  it('should return whoami data without mock fallback', async () => {
    const whoami = await service.whoami();
    expect(whoami.user.email).toBe('user@livebrand.ai');
    expect(whoami.brands.length).toBe(1);
    expect(whoami.credits.balance).toBe(450);
  });

  it('should throw error when whoami upstream fails', async () => {
    vi.spyOn(apiClient, 'callTool').mockRejectedValueOnce(new Error('Upstream 401 Unauthorized'));
    await expect(service.whoami()).rejects.toThrow(/Upstream 401 Unauthorized/i);
  });

  it('should return credit balance from upstream', async () => {
    const balance = await service.getCreditBalance();
    expect(balance.balance).toBe(450);
    expect(balance.draftArticleCost).toBe(30);
  });

  it('should throw error when credit balance upstream fails', async () => {
    vi.spyOn(apiClient, 'callTool').mockRejectedValueOnce(new Error('Upstream 401 Unauthorized'));
    await expect(service.getCreditBalance()).rejects.toThrow(/Upstream 401 Unauthorized/i);
  });

  it('should return run allowances aligned with CogNerd Run System', async () => {
    const usage = await service.getRunAllowance();
    expect(usage.plan.code).toBe('partner');
    expect(usage.allowances['runs.monthly'].limit).toBe(15);
    expect(usage.allowances['runs.monthly'].remaining).toBe(15);
    expect(usage.allowances['tools.aeo_audit.daily'].limit).toBe(5);
    expect(usage.allowances['brands.max'].limit).toBe(10);
  });

  it('should return audience personas', async () => {
    const audience = await service.getAudiencePersonas();
    expect(audience.personas.length).toBeGreaterThan(0);
    expect(audience.totalPersonas).toBeGreaterThan(0);
  });

  it('should return prompt intelligence and weak prompts', async () => {
    const prompts = await service.getPromptIntelligence();
    expect(prompts.totalPrompts).toBeGreaterThan(0);
    expect(prompts.prompts.length).toBeGreaterThan(0);
  });

  it('should return AI visibility metrics and filtered rows', async () => {
    const visibility = await service.getAiVisibility({ engine: 'all', mentioned: 'all' });
    expect(visibility.filters).toBeDefined();
  });

  it('should return citations data and domain coverage', async () => {
    const citations = await service.getCitations('all');
    expect(citations.engine).toBe('all');
  });

  it('should return AI insights and trends', async () => {
    const insights = await service.getAiInsights();
    expect(insights.metrics).toBeDefined();
  });

  it('should return competitive intelligence', async () => {
    const comp = await service.getCompetitiveIntelligence();
    expect(comp.dimensions.length).toBeGreaterThan(0);
  });

  it('should return scan history and AEO audit', async () => {
    const scan = await service.getScanHistory();
    expect(scan.totalRuns).toBeGreaterThan(0);

    const audit = await service.getAiReadinessAudit();
    expect(audit.score).toBeGreaterThan(0);
  });

  it('should return GEO assets and AGXP loop score', async () => {
    const geo = await service.getGeoAssets();
    expect(geo.totalAssets).toBeGreaterThan(0);

    const agxp = await service.getAgxp();
    expect(agxp.loopScore).toBeDefined();
  });

  it('should return content studio briefs', async () => {
    const studio = await service.getContentStudio('all');
    expect(studio.status).toBe('all');
  });

  it('Phase 1: should generate GEO assets bundle', async () => {
    const geoJob = await service.generateGeoAssetsLive();
    expect(geoJob.jobId).toBeDefined();
    expect(geoJob.assets.length).toBeGreaterThan(0);
    expect(geoJob.status).toBe('completed');
  });

  it('Phase 1: should trigger AEO audit and fetch latest report', async () => {
    const aeo = await service.triggerAeoAuditLive();
    expect(aeo.score).toBeGreaterThan(0);
    expect(aeo.findings.length).toBeGreaterThan(0);

    const report = await service.getLatestAeoReport();
    expect(report.score).toBeGreaterThan(0);
  });

  it('Phase 1: should return technical site diagnostics', async () => {
    const diag = await service.getTechnicalDiagnostics();
    expect(diag.status).toBe('healthy');
    expect(diag.crawlability.llmsTxt).toBe(true);
    expect(diag.aiEngineAccess.gptBot).toBe(true);
  });

  it('Phase 1: should generate ICP and suggest buyer personas', async () => {
    const icp = await service.generateIcpLive();
    expect(icp.icp).toBeDefined();
    expect(icp.personas.length).toBeGreaterThan(0);
    expect(icp.creditsDeducted).toBe(6);

    const suggested = await service.suggestPersonasLive({ industry: 'AI' });
    expect(suggested.personas.length).toBeGreaterThan(0);
  });

  it('Phase 1: should manage tracked competitors', async () => {
    const compResult = await service.manageCompetitorLive('list');
    expect(compResult.totalCompetitors).toBeGreaterThan(0);
    expect(compResult.competitors.length).toBeGreaterThan(0);
  });

  it('Phase 2: should generate and fetch LinkedIn carousel deck', async () => {
    const carousel = await service.generateCarouselLive({ topic: 'Generative Engine Optimization' });
    expect(carousel.id).toBeDefined();
    expect(carousel.slides.length).toBeGreaterThan(0);
    expect(carousel.creditsDeducted).toBe(15);

    const fetched = await service.getCarouselDeckLive(carousel.id);
    expect(fetched.id).toBeDefined();

    const rerendered = await service.rerenderCarouselLive(carousel.id, { theme: 'dark' });
    expect(rerendered.status).toBe('rendered');
  });

  it('Phase 2: should run article wizard flow and finalize to blog', async () => {
    const project = await service.startArticleWizardLive({
      targetPrompt: 'Best MCP Framework',
      title: 'Guide to MCP',
    });
    expect(project.id).toBeDefined();
    expect(project.outline.length).toBeGreaterThan(0);
    expect(project.creditsReserved).toBe(30);

    const stepRes = await service.runArticleWizardStepLive(project.id, 'research');
    expect(stepRes.status).toBe('success');

    const finalized = await service.finalizeArticleToBlogLive(project.id);
    expect(finalized.status).toBe('published');
  });

  it('Phase 2: should repurpose article to social and rewrite paragraph', async () => {
    const repurposed = await service.repurposeArticleLive('sample-proj-1');
    expect(repurposed.linkedin.postText).toBeDefined();
    expect(repurposed.twitter.thread.length).toBeGreaterThan(0);

    const rewrite = await service.rewriteParagraphLive({ text: 'Our platform helps SEO teams.' });
    expect(rewrite.rewrittenText).toBeDefined();
    expect(rewrite.improvements.length).toBeGreaterThan(0);

    const standalone = await service.generateStandaloneSocialLive({ topic: 'AI Visibility' });
    expect(standalone.content).toBeDefined();
  });

  it('Phase 3: should return backlinks profile and competitor comparisons', async () => {
    const backlinks = await service.getBacklinksSnapshotLive();
    expect(backlinks.totalBacklinks).toBeGreaterThan(0);
    expect(backlinks.referringDomains).toBeGreaterThan(0);
    expect(backlinks.competitors.length).toBeGreaterThan(0);
    expect(backlinks.aiCitationCorrelation).toBeDefined();

    const refresh = await service.refreshCompetitorBacklinksLive();
    expect(refresh.status).toBe('refreshed');
    expect(refresh.creditsDeducted).toBe(15);
  });

  it('Phase 3: should return Search Console and GA4 telemetry', async () => {
    const gsc = await service.getSearchConsoleReportLive(30);
    expect(gsc.totalClicks).toBeGreaterThan(0);
    expect(gsc.topQueries.length).toBeGreaterThan(0);

    const sites = await service.listSearchConsoleSitesLive();
    expect(sites.length).toBeGreaterThan(0);

    const ga4 = await service.getGa4TrafficReportLive();
    expect(ga4.totalUsers).toBeGreaterThan(0);
    expect(ga4.channels.length).toBeGreaterThan(0);
  });

  it('Phase 3: should return Clarity, Google Ads, and integrations status', async () => {
    const clarity = await service.getClarityReportLive();
    expect(clarity.totalSessions).toBeGreaterThan(0);
    expect(clarity.scrollDepthPercent).toBeGreaterThan(0);

    const ads = await service.getGoogleAdsReportLive();
    expect(ads.totalSpend).toBeGreaterThan(0);
    expect(ads.conversions).toBeGreaterThan(0);

    const integrations = await service.getIntegrationsStatusLive();
    expect(integrations.totalToolkits).toBeGreaterThan(0);
    expect(integrations.connectedCount).toBeGreaterThan(0);
  });
});
