import crypto from 'node:crypto';
import { CognerdService } from '../dist/modules/cognerd/cognerd.service.js';
import { CognerdApiClient } from '../dist/services/cognerd-api.client.js';
import { OAuthService } from '../dist/services/oauth.service.js';

const BASE_URL = 'https://mcp.cognerd.in';
const SANDBOX_EMAIL = 'nitrostack.sandbox@cognerd.ai';
const SANDBOX_PASSWORD = 'VDAPdpRAWFobUhyb';
const REDIRECT_URI = 'http://localhost:3005/auth/callback';

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
  console.log('🔑 Step 1: Acquiring OAuth access token...');
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: 'Phase 1 Tester', redirect_uris: [REDIRECT_URI] }),
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
  console.log(`✅ Token: ${tokenData.access_token.slice(0, 15)}...`);
  return tokenData.access_token;
}

async function runPhase1Tests() {
  console.log('================================================================');
  console.log('🧪 TESTING PHASE 1: AEO/GEO REMEDIATION & AUDIENCE INTELLIGENCE');
  console.log('================================================================\n');

  let token;
  try {
    token = await getLiveToken();
  } catch (err) {
    console.warn('⚠️ Could not acquire live token, running in mock/fallback mode:', err.message);
  }

  const oauthService = new OAuthService();
  if (token) {
    oauthService.setAccessToken(token, 3600, 'cognerd');
  }
  const apiClient = new CognerdApiClient(oauthService);
  const service = new CognerdService(apiClient);

  const phase1Tests = [
    {
      name: 'generate_geo_assets (Live llms.txt & schema generation)',
      fn: () => service.generateGeoAssetsLive(),
    },
    {
      name: 'trigger_aeo_audit (Technical AEO site audit crawl)',
      fn: () => service.triggerAeoAuditLive(),
    },
    {
      name: 'get_latest_aeo_report (Fetch AEO report breakdown)',
      fn: () => service.getLatestAeoReport(),
    },
    {
      name: 'get_technical_diagnostics (Site crawler rules & diagnostics)',
      fn: () => service.getTechnicalDiagnostics(),
    },
    {
      name: 'generate_icp (Ideal Customer Profile auto-generator)',
      fn: () => service.generateIcpLive(),
    },
    {
      name: 'suggest_personas (Contextual buyer persona suggestions)',
      fn: () => service.suggestPersonasLive({
        name: 'CogNerd',
        industry: 'Generative Engine Optimization (GEO)',
        description: 'AI Visibility intelligence and optimization platform for brands.',
      }),
    },
    {
      name: 'manage_competitors (Tracked competitor management)',
      fn: () => service.manageCompetitorLive('list'),
    },
  ];

  const results = [];

  for (const t of phase1Tests) {
    const start = Date.now();
    try {
      const data = await t.fn();
      const elapsed = Date.now() - start;
      const preview = JSON.stringify(data).slice(0, 90) + '...';
      console.log(`✅ [PASS] ${t.name} (${elapsed}ms)\n   ${preview}\n`);
      results.push({ test: t.name, status: 'PASS', elapsed: `${elapsed}ms`, preview });
    } catch (err) {
      const elapsed = Date.now() - start;
      console.log(`❌ [FAIL] ${t.name} (${elapsed}ms): ${err.message}\n`);
      results.push({ test: t.name, status: 'FAIL', elapsed: `${elapsed}ms`, error: err.message });
    }
  }

  console.log('================================================================');
  console.log('📊 PHASE 1 TEST SUMMARY');
  console.log('================================================================');
  console.table(results);
}

runPhase1Tests().catch(console.error);
