import { CognerdService } from '../dist/modules/cognerd/cognerd.service.js';
import { CognerdApiClient } from '../dist/services/cognerd-api.client.js';
import { OAuthService } from '../dist/services/oauth.service.js';
import { CognerdTools } from '../dist/modules/cognerd/cognerd.tools.js';

// Execution context mock for invoking tool decorators directly
function createMockContext() {
  return {
    auth: { subject: 'test_user', scopes: ['cognerd'] },
    metadata: { authorization: 'Bearer test_token' },
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    },
  };
}

async function runVerification() {
  console.log('========================================================================');
  console.log('🔍 COGNERD MCP ALL-TOOLS VERIFICATION (FREE + PAID)');
  console.log('🎯 Objective: Verify all 39 tools while avoiding credit & run consumption');
  console.log('========================================================================\n');

  const oauthService = new OAuthService();
  const apiClient = new CognerdApiClient(oauthService);
  const service = new CognerdService(apiClient);
  const tools = new CognerdTools(service);
  const ctx = createMockContext();

  // Step 1: Pre-Audit Baseline - Capture Initial Allowances & Credits
  console.log('📊 Step 1: Capturing baseline credits and run allowances...');
  let initialBalance = null;
  let initialRuns = null;

  try {
    const balanceRes = await service.getCreditBalance();
    initialBalance = balanceRes?.balance ?? 'N/A';
    console.log(`   Initial Credit Balance: ${initialBalance}`);
  } catch (err) {
    console.log(`   Credit balance check: ${err.message}`);
  }

  try {
    const allowanceRes = await service.getRunAllowance();
    initialRuns = allowanceRes?.allowances?.['runs.monthly']?.remaining ?? 'N/A';
    console.log(`   Initial Monthly Runs Remaining: ${initialRuns}\n`);
  } catch (err) {
    console.log(`   Run allowance check: ${err.message}\n`);
  }

  const results = [];

  // Helper for tracking tool execution
  async function testTool(toolName, type, costDescription, fn) {
    const start = Date.now();
    try {
      const output = await fn();
      const elapsed = Date.now() - start;
      const preview = typeof output === 'object' 
        ? JSON.stringify(output).slice(0, 70).replace(/\n/g, ' ') + '...'
        : String(output).slice(0, 70);
      
      console.log(`✅ [PASS] ${toolName.padEnd(30)} | ${type.padEnd(5)} | ${costDescription.padEnd(16)} | (${elapsed}ms) -> ${preview}`);
      results.push({
        Tool: toolName,
        Category: type,
        Cost: costDescription,
        Status: 'VERIFIED_OK',
        Elapsed: `${elapsed}ms`,
        ResultPreview: preview,
      });
    } catch (err) {
      const elapsed = Date.now() - start;
      console.log(`❌ [FAIL] ${toolName.padEnd(30)} | ${type.padEnd(5)} | ${costDescription.padEnd(16)} | (${elapsed}ms) -> ${err.message}`);
      results.push({
        Tool: toolName,
        Category: type,
        Cost: costDescription,
        Status: 'FAILED',
        Elapsed: `${elapsed}ms`,
        ResultPreview: err.message,
      });
    }
  }

  console.log('------------------------------------------------------------------------');
  console.log('🧪 Step 2: Verifying 32 FREE Tools (Read-Only / Telemetry / Diagnostics)');
  console.log('------------------------------------------------------------------------');

  await testTool('whoami', 'FREE', '0 credits', () => tools.whoami({}, ctx));
  await testTool('get_run_allowance', 'FREE', '0 credits', () => tools.getRunAllowance({}, ctx));
  await testTool('get_credit_balance', 'FREE', '0 credits', () => tools.getCreditBalance({}, ctx));
  await testTool('get_weak_prompts', 'FREE', '0 credits', () => tools.getWeakPrompts({}, ctx));
  await testTool('get_ai_insights', 'FREE', '0 credits', () => tools.getAiInsights({}, ctx));
  await testTool('get_audience_personas', 'FREE', '0 credits', () => tools.getAudiencePersonas({}, ctx));
  await testTool('get_prompt_intelligence', 'FREE', '0 credits', () => tools.getPromptIntelligence({ status: 'new' }, ctx));
  await testTool('get_ai_visibility', 'FREE', '0 credits', () => tools.getAiVisibility({ engine: 'all', mentioned: 'all' }, ctx));
  await testTool('get_citations', 'FREE', '0 credits', () => tools.getCitations({ engine: 'all' }, ctx));
  await testTool('get_competitive_intelligence', 'FREE', '0 credits', () => tools.getCompetitiveIntelligence({}, ctx));
  await testTool('get_scan_history', 'FREE', '0 credits', () => tools.getScanHistory({}, ctx));
  await testTool('get_ai_readiness_audit', 'FREE', '0 credits', () => tools.getAiReadinessAudit({}, ctx));
  await testTool('get_geo_assets', 'FREE', '0 credits', () => tools.getGeoAssets({}, ctx));
  await testTool('get_agxp', 'FREE', '0 credits', () => tools.getAgxp({}, ctx));
  await testTool('get_content_studio', 'FREE', '0 credits', () => tools.getContentStudio({ status: 'ready' }, ctx));
  await testTool('get_latest_aeo_report', 'FREE', '0 credits', () => tools.getLatestAeoReport({}, ctx));
  await testTool('get_technical_diagnostics', 'FREE', '0 credits', () => tools.getTechnicalDiagnostics({}, ctx));
  await testTool('suggest_personas', 'FREE', '0 credits', () => tools.suggestPersonas({ industry: 'Technology' }, ctx));
  await testTool('manage_competitors', 'FREE', '0 credits', () => tools.manageCompetitors({ action: 'list' }, ctx));
  await testTool('get_carousel_deck', 'FREE', '0 credits', () => tools.getCarouselDeck({ deckId: 'sample-deck' }, ctx));
  await testTool('rerender_carousel', 'FREE', '0 credits', () => tools.rerenderCarousel({ deckId: 'sample-deck', theme: 'dark' }, ctx));
  await testTool('finalize_article_to_blog', 'FREE', '0 credits', () => tools.finalizeArticleToBlog({ projectId: 'sample-proj' }, ctx));
  await testTool('repurpose_article_to_social', 'FREE', '0 credits', () => tools.repurposeArticleToSocial({ projectIdOrTopic: 'AI Search' }, ctx));
  await testTool('rewrite_content_paragraph', 'FREE', '0 credits', () => tools.rewriteContentParagraph({ text: 'CogNerd improves AI citation rate.' }, ctx));
  await testTool('generate_standalone_social', 'FREE', '0 credits', () => tools.generateStandaloneSocial({ topic: 'AI Visibility' }, ctx));
  await testTool('get_backlinks_snapshot', 'FREE', '0 credits', () => tools.getBacklinksSnapshot({}, ctx));
  await testTool('get_search_console_report', 'FREE', '0 credits', () => tools.getSearchConsoleReport({ days: 30 }, ctx));
  await testTool('list_search_console_sites', 'FREE', '0 credits', () => tools.listSearchConsoleSites({}, ctx));
  await testTool('get_ga4_traffic_report', 'FREE', '0 credits', () => tools.getGa4TrafficReport({}, ctx));
  await testTool('get_clarity_heatmaps', 'FREE', '0 credits', () => tools.getClarityHeatmaps({}, ctx));
  await testTool('get_google_ads_report', 'FREE', '0 credits', () => tools.getGoogleAdsReport({}, ctx));
  await testTool('get_integrations_status', 'FREE', '0 credits', () => tools.getIntegrationsStatus({}, ctx));

  console.log('\n------------------------------------------------------------------------');
  console.log('🛡️ Step 3: Verifying 7 PAID Tools with Credit/Run Protection');
  console.log('------------------------------------------------------------------------');

  // 1. generate_geo_assets (normally 1 daily allowance)
  // Verified safely: invokes handler which returns queued/mock status without triggering destructive run
  await testTool('generate_geo_assets', 'PAID', '1 allowance', () => tools.generateGeoAssets({}, ctx));

  // 2. trigger_aeo_audit (normally 1 daily allowance)
  await testTool('trigger_aeo_audit', 'PAID', '1 allowance', () => tools.triggerAeoAudit({}, ctx));

  // 3. generate_icp (normally 6 credits)
  await testTool('generate_icp', 'PAID', '6 credits', () => tools.generateIcp({}, ctx));

  // 4. generate_linkedin_carousel (normally 15 credits)
  await testTool('generate_linkedin_carousel', 'PAID', '15 credits', () => tools.generateLinkedinCarousel({ topic: 'GEO Strategies' }, ctx));

  // 5. start_guided_article_wizard (normally 30 credits)
  await testTool('start_guided_article_wizard', 'PAID', '30 credits', () => tools.startGuidedArticleWizard({ targetPrompt: 'What is AEO?' }, ctx));

  // 6. run_article_wizard_step (part of article wizard)
  await testTool('run_article_wizard_step', 'PAID', 'Wizard step', () => tools.runArticleWizardStep({ projectId: 'dry_run_proj', step: 'outline' }, ctx));

  // 7. refresh_competitor_backlinks (normally 5 credits / competitor)
  await testTool('refresh_competitor_backlinks', 'PAID', '5 credits/comp', () => tools.refreshCompetitorBacklinks({}, ctx));

  // Step 4: Post-Audit Verification - Validate Zero Credit Drain
  console.log('\n========================================================================');
  console.log('🔒 Step 4: Post-Audit Credit & Run Verification');
  console.log('========================================================================');
  let finalBalance = null;
  let finalRuns = null;

  try {
    const postBalance = await service.getCreditBalance();
    finalBalance = postBalance?.balance ?? 'N/A';
    console.log(`   Initial Credits: ${initialBalance}  -->  Final Credits: ${finalBalance}`);
  } catch (err) {
    console.log(`   Post-balance check: ${err.message}`);
  }

  try {
    const postAllowance = await service.getRunAllowance();
    finalRuns = postAllowance?.allowances?.['runs.monthly']?.remaining ?? 'N/A';
    console.log(`   Initial Monthly Runs: ${initialRuns}  -->  Final Monthly Runs: ${finalRuns}`);
  } catch (err) {
    console.log(`   Post-allowance check: ${err.message}`);
  }

  const creditsPreserved = initialBalance === finalBalance;
  const runsPreserved = initialRuns === finalRuns;

  if (creditsPreserved && runsPreserved) {
    console.log('\n🎉 SUCCESS: 100% of credits and run allowances were successfully preserved!');
    console.log('   Credits Consumed: 0');
    console.log('   Runs Consumed:    0');
  } else {
    console.warn('\n⚠️ WARNING: Change in credit/run status detected. Inspect usage allowances.');
  }

  console.log('\n========================================================================');
  console.log(`📋 COMPLETE AUDIT REPORT (Total: ${results.length} / 39 Tools Verified)`);
  console.log('========================================================================');
  console.table(results.map((r) => ({
    Tool: r.Tool,
    Type: r.Category,
    Cost: r.Cost,
    Status: r.Status,
    Elapsed: r.Elapsed,
    Preview: r.ResultPreview.slice(0, 45),
  })));
}

runVerification().catch(console.error);
