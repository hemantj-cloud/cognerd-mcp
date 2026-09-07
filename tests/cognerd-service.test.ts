import { describe, it, expect } from 'vitest';
import { CognerdService } from '../src/modules/cognerd/cognerd.service.js';
import { CognerdApiClient } from '../src/services/cognerd-api.client.js';
import { OAuthService } from '../src/services/oauth.service.js';

describe('CogNerd Service & Tools Integration', { timeout: 15000 }, () => {
  const oauthService = new OAuthService();
  const apiClient = new CognerdApiClient(oauthService);
  const service = new CognerdService(apiClient);

  it('should return brand profile', async () => {
    const brand = await service.getBrand();
    expect(brand.name).toBe('NitroStack');
    expect(brand.domain).toBe('nitrostack.ai');
  });

  it('should return whoami data', async () => {
    const whoami = await service.whoami();
    expect(whoami.user).toBeDefined();
    expect(whoami.brands.length).toBeGreaterThan(0);
    expect(whoami.credits).toBeDefined();
  });

  it('should return credit balance', async () => {
    const balance = await service.getCreditBalance();
    expect(balance.balance).toBeGreaterThanOrEqual(0);
    expect(balance.draftArticleCost).toBe(30);
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
    expect(visibility.metrics.trackedPrompts).toBeGreaterThan(0);
    expect(visibility.rows.length).toBeGreaterThan(0);
  });

  it('should return citations data and domain coverage', async () => {
    const citations = await service.getCitations('all');
    expect(citations.metrics.totalCitations).toBeGreaterThan(0);
    expect(citations.citations.length).toBeGreaterThan(0);
  });

  it('should return AI insights and trends', async () => {
    const insights = await service.getAiInsights();
    expect(insights.metrics.visibilityScore).toBeGreaterThan(0);
    expect(insights.trend.length).toBeGreaterThan(0);
  });

  it('should return competitive intelligence', async () => {
    const comp = await service.getCompetitiveIntelligence();
    expect(comp.trackedBrands).toBeGreaterThan(0);
    expect(comp.competitors.length).toBeGreaterThan(0);
  });

  it('should return scan history and AEO audit', async () => {
    const scan = await service.getScanHistory();
    expect(scan.totalRuns).toBeGreaterThan(0);

    const audit = await service.getAiReadinessAudit();
    expect(audit.score).toBeGreaterThan(0);
    expect(audit.findings.length).toBeGreaterThan(0);
  });

  it('should return GEO assets and AGXP loop score', async () => {
    const geo = await service.getGeoAssets();
    expect(geo.totalAssets).toBeGreaterThan(0);

    const agxp = await service.getAgxp();
    expect(agxp.loopScore).toBeGreaterThan(0);
    expect(agxp.stages.length).toBe(6);
  });

  it('should return content studio briefs', async () => {
    const studio = await service.getContentStudio('all');
    expect(studio.totalBriefs).toBeGreaterThan(0);
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
});


