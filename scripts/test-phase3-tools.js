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
  console.log('🔑 Acquiring OAuth access token...');
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: 'Phase 3 Tester', redirect_uris: [REDIRECT_URI] }),
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

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('🧪 TESTING PHASE 3: DEEP TELEMETRY, BACKLINKS & LIVE INTEGRATIONS');
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

  const phase3Tests = [
    {
      name: 'get_backlinks_snapshot (DataForSEO backlink profile & benchmarks)',
      fn: () => service.getBacklinksSnapshotLive(),
    },
    {
      name: 'refresh_competitor_backlinks (Live DataForSEO crawl refresh)',
      fn: () => service.refreshCompetitorBacklinksLive(),
    },
    {
      name: 'get_search_console_report (Google Search Console performance)',
      fn: () => service.getSearchConsoleReportLive(30),
    },
    {
      name: 'list_search_console_sites (Verified GSC site properties)',
      fn: () => service.listSearchConsoleSitesLive(),
    },
    {
      name: 'get_ga4_traffic_report (GA4 traffic channels & AI referral share)',
      fn: () => service.getGa4TrafficReportLive(),
    },
    {
      name: 'get_clarity_heatmaps (Microsoft Clarity UX metrics & scroll depth)',
      fn: () => service.getClarityReportLive(),
    },
    {
      name: 'get_google_ads_report (Paid search spend & conversion tracking)',
      fn: () => service.getGoogleAdsReportLive(),
    },
    {
      name: 'get_integrations_status (Toolkit authentication & connection checks)',
      fn: () => service.getIntegrationsStatusLive(),
    },
  ];

  const results = [];

  for (const t of phase3Tests) {
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
  console.log('📊 PHASE 3 TEST SUMMARY');
  console.log('================================================================');
  console.table(results);
}

runPhase3Tests().catch(console.error);
