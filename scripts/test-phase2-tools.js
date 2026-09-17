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
    body: JSON.stringify({ client_name: 'Phase 2 Tester', redirect_uris: [REDIRECT_URI] }),
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

async function runPhase2Tests() {
  console.log('================================================================');
  console.log('🧪 TESTING PHASE 2: CONTENT STUDIO & MULTI-CHANNEL SOCIAL CAROUSELS');
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

  const phase2Tests = [
    {
      name: 'generate_linkedin_carousel (Multi-slide carousel builder)',
      fn: () => service.generateCarouselLive({
        topic: 'Why AI Search is Replacing Traditional SEO',
        slideCount: 6,
        theme: 'bold',
      }),
    },
    {
      name: 'get_carousel_deck (Retrieve slide deck copy & layout)',
      fn: () => service.getCarouselDeckLive('deck-sample-1'),
    },
    {
      name: 'rerender_carousel (Re-render slide templates)',
      fn: () => service.rerenderCarouselLive('deck-sample-1', { theme: 'dark' }),
    },
    {
      name: 'start_guided_article_wizard (Research-grounded article init)',
      fn: () => service.startArticleWizardLive({
        targetPrompt: 'Best MCP Framework for TypeScript Developers',
        title: 'Complete Guide to Building MCP Servers with NitroStack',
      }),
    },
    {
      name: 'run_article_wizard_step (Execute fact research step)',
      fn: () => service.runArticleWizardStepLive('proj-sample-1', 'research'),
    },
    {
      name: 'finalize_article_to_blog (Publish to brand blog library)',
      fn: () => service.finalizeArticleToBlogLive('proj-sample-1'),
    },
    {
      name: 'repurpose_article_to_social (Repurpose into LinkedIn & X threads)',
      fn: () => service.repurposeArticleLive('proj-sample-1'),
    },
    {
      name: 'rewrite_content_paragraph (AI search citation optimizer)',
      fn: () => service.rewriteParagraphLive({
        text: 'Our framework helps developers build MCP apps quickly.',
        intent: 'Answer Engine Citation Readiness',
      }),
    },
    {
      name: 'generate_standalone_social (Standalone social copy generator)',
      fn: () => service.generateStandaloneSocialLive({
        topic: 'Generative Engine Optimization',
        platform: 'both',
      }),
    },
  ];

  const results = [];

  for (const t of phase2Tests) {
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
  console.log('📊 PHASE 2 TEST SUMMARY');
  console.log('================================================================');
  console.table(results);
}

runPhase2Tests().catch(console.error);
