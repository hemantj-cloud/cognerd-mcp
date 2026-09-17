import crypto from 'node:crypto';
import { CognerdService } from '../dist/modules/cognerd/cognerd.service.js';
import { CognerdApiClient } from '../dist/services/cognerd-api.client.js';
import { OAuthService } from '../dist/services/oauth.service.js';
import { TEST_CONFIG } from './load-test-env.js';

const BASE_URL = TEST_CONFIG.baseUrl;
const SANDBOX_EMAIL = TEST_CONFIG.email;
const SANDBOX_PASSWORD = TEST_CONFIG.password;
const REDIRECT_URI = TEST_CONFIG.redirectUri;

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generatePkce() {
  const verifierBytes = crypto.randomBytes(32);
  const codeVerifier = base64UrlEncode(verifierBytes);
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64UrlEncode(hash);
  const state = base64UrlEncode(crypto.randomBytes(16));
  return { codeVerifier, codeChallenge, state };
}

async function getLiveToken() {
  console.log('🔑 Step 1: Acquiring fresh live OAuth 2.1 access token...');
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: 'Live Tool Tester', redirect_uris: [REDIRECT_URI] }),
  });
  const clientData = await regRes.json();
  const pkce = generatePkce();

  const authBody = new URLSearchParams({
    client_id: clientData.client_id,
    redirect_uri: REDIRECT_URI,
    state: pkce.state,
    code_challenge: pkce.codeChallenge,
    code_challenge_method: 'S256',
    scope: 'cognerd',
    email: SANDBOX_EMAIL,
    password: SANDBOX_PASSWORD,
  });

  const authRes = await fetch(`${BASE_URL}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: authBody.toString(),
    redirect: 'manual',
  });

  const location = authRes.headers.get('location');
  if (!location) throw new Error('Authorization failed');
  const redirectUrl = new URL(location);
  const code = redirectUrl.searchParams.get('code');

  const tokenRes = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientData.client_id,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: pkce.codeVerifier,
    }).toString(),
  });

  const tokenData = await tokenRes.json();
  console.log(`✅ Live Token: ${tokenData.access_token.slice(0, 15)}... (Scope: ${tokenData.scope})`);
  return tokenData.access_token;
}

async function testAllTools() {
  console.log('================================================================');
  console.log('🧪 LIVE INTEGRATION & REAL API EXECUTION TEST');
  console.log('================================================================\n');

  const token = await getLiveToken();

  // Setup services configured with this live token
  const oauthService = new OAuthService();
  oauthService.setAccessToken(token, 3600, 'cognerd');
  const apiClient = new CognerdApiClient(oauthService);
  const service = new CognerdService(apiClient);

  console.log('\n--- Step 2: Testing NitroStack Tools with Live Services ---\n');

  const tests = [
    { name: 'whoami', fn: () => service.whoami() },
    { name: 'get_credit_balance', fn: () => service.getCreditBalance() },
    { name: 'get_weak_prompts', fn: () => service.getPromptIntelligence('new') },
    { name: 'get_audience_personas', fn: () => service.getAudiencePersonas() },
    { name: 'get_prompt_intelligence', fn: () => service.getPromptIntelligence('active') },
    { name: 'get_ai_insights', fn: () => service.getAiInsights() },
    { name: 'get_ai_visibility', fn: () => service.getAiVisibility({ engine: 'all', mentioned: 'all' }) },
    { name: 'getCitations', fn: () => service.getCitations('all') },
    { name: 'getCompetitiveIntelligence', fn: () => service.getCompetitiveIntelligence() },
    { name: 'getScanHistory', fn: () => service.getScanHistory() },
    { name: 'getAiReadinessAudit', fn: () => service.getAiReadinessAudit() },
    { name: 'getGeoAssets', fn: () => service.getGeoAssets() },
    { name: 'getAgxp', fn: () => service.getAgxp() },
    { name: 'getContentStudio', fn: () => service.getContentStudio('all') },
  ];

  const results = [];

  for (const t of tests) {
    const start = Date.now();
    try {
      const data = await t.fn();
      const elapsed = Date.now() - start;
      const dataPreview = JSON.stringify(data).slice(0, 80) + '...';
      console.log(`✅ [SUCCESS] ${t.name} (${elapsed}ms) -> ${dataPreview}`);
      results.push({ name: t.name, status: 'SUCCESS', elapsed: `${elapsed}ms`, preview: dataPreview });
    } catch (err) {
      const elapsed = Date.now() - start;
      console.log(`❌ [FAILED] ${t.name} (${elapsed}ms) -> ${err.message}`);
      results.push({ name: t.name, status: 'FAILED', elapsed: `${elapsed}ms`, error: err.message });
    }
  }

  console.log('\n--- Step 3: Testing Direct Upstream MCP Tool Calls via Gateway ---\n');
  const upstreamTools = [
    'whoami',
    'get_credit_balance',
    'get_weak_prompts',
    'get_brand_context',
    'get_brand_history',
    'get_audit_report',
    'get_geo_assets',
    'get_citation_score',
    'get_watch_status',
  ];

  const upstreamResults = [];
  for (const uTool of upstreamTools) {
    const start = Date.now();
    try {
      const res = await apiClient.callTool(uTool, {});
      const elapsed = Date.now() - start;
      if (res) {
        const preview = JSON.stringify(res).slice(0, 80) + '...';
        console.log(`📡 [LIVE MCP] ${uTool} (${elapsed}ms) -> ${preview}`);
        upstreamResults.push({ tool: uTool, status: 'LIVE_DATA', elapsed: `${elapsed}ms`, preview });
      } else {
        console.log(`⚠️ [FALLBACK/EMPTY] ${uTool} (${elapsed}ms)`);
        upstreamResults.push({ tool: uTool, status: 'FALLBACK', elapsed: `${elapsed}ms` });
      }
    } catch (e) {
      console.log(`❌ [ERROR] ${uTool} -> ${e.message}`);
      upstreamResults.push({ tool: uTool, status: 'ERROR', error: e.message });
    }
  }

  console.log('\n================================================================');
  console.log('📊 TEST SUMMARY REPORT');
  console.log('================================================================');
  console.table(results);
  console.log('\nUpstream Gateway Tool Call Results:');
  console.table(upstreamResults);
}

testAllTools().catch(console.error);
