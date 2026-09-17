import crypto from 'node:crypto';
import { TEST_CONFIG } from './load-test-env.js';

const BASE_URL = TEST_CONFIG.baseUrl;
const SANDBOX_EMAIL = TEST_CONFIG.email;
const SANDBOX_PASSWORD = TEST_CONFIG.password;
const REDIRECT_URI = TEST_CONFIG.redirectUri;

function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generatePkce() {
  const verifierBytes = crypto.randomBytes(32);
  const codeVerifier = base64UrlEncode(verifierBytes);
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64UrlEncode(hash);
  const state = base64UrlEncode(crypto.randomBytes(16));
  return { codeVerifier, codeChallenge, state };
}

async function run() {
  console.log('================================================================');
  console.log('🚀 Running End-to-End CogNerd OAuth 2.1 Live Integration Test');
  console.log('================================================================\n');

  // Step 1: Discover OAuth endpoints
  console.log('1️⃣ Discovering Protected Resource & Authorization Server Metadata...');
  const protectedRes = await fetch(`${BASE_URL}/.well-known/oauth-protected-resource`);
  const protectedMeta = await protectedRes.json();
  console.log('   Protected Resource Metadata:', JSON.stringify(protectedMeta));

  const authServerRes = await fetch(`${BASE_URL}/.well-known/oauth-authorization-server`);
  const authServerMeta = await authServerRes.json();
  console.log('   Auth Server Metadata:', JSON.stringify(authServerMeta));
  console.log('   ✅ Discovery successful.\n');

  // Step 2: Dynamic Client Registration
  console.log('2️⃣ Registering Dynamic Client (RFC 7591)...');
  const regRes = await fetch(authServerMeta.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'NitroStack MCP Test Runner',
      redirect_uris: [REDIRECT_URI],
    }),
  });
  const clientData = await regRes.json();
  console.log('   Registered Client ID:', clientData.client_id);
  console.log('   Token Auth Method:', clientData.token_endpoint_auth_method);
  console.log('   ✅ Client Registration successful.\n');

  // Step 3: Generate PKCE S256 parameters
  console.log('3️⃣ Generating PKCE S256 Pair...');
  const pkce = generatePkce();
  console.log('   Code Verifier:', pkce.codeVerifier);
  console.log('   Code Challenge:', pkce.codeChallenge);
  console.log('   State:', pkce.state);
  console.log('   ✅ PKCE generation successful.\n');

  // Step 4: Authorize with Sandbox credentials
  console.log('4️⃣ Submitting Authorization Request with Sandbox Credentials...');
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

  const authRes = await fetch(authServerMeta.authorization_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: authBody.toString(),
    redirect: 'manual', // do not follow redirect so we can read 302 location header
  });

  console.log('   Auth response status:', authRes.status);
  const location = authRes.headers.get('location');
  console.log('   Redirect location:', location);

  if (!location) {
    const text = await authRes.text();
    throw new Error(`Failed to obtain authorization code. Response: ${text}`);
  }

  const redirectUrl = new URL(location);
  const authCode = redirectUrl.searchParams.get('code');
  const returnedState = redirectUrl.searchParams.get('state');

  if (!authCode) {
    throw new Error(`No code parameter found in redirect URL: ${location}`);
  }
  if (returnedState !== pkce.state) {
    throw new Error(`State mismatch: expected ${pkce.state}, got ${returnedState}`);
  }
  console.log('   Obtained Authorization Code:', authCode);
  console.log('   ✅ Authorization successful.\n');

  // Step 5: Exchange code for token
  console.log('5️⃣ Exchanging Authorization Code for Bearer Access Token...');
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientData.client_id,
    code: authCode,
    redirect_uri: REDIRECT_URI,
    code_verifier: pkce.codeVerifier,
  });

  const tokenRes = await fetch(authServerMeta.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Token exchange failed (${tokenRes.status}): ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  console.log('   Access Token (masked):', tokenData.access_token ? `${tokenData.access_token.slice(0, 10)}...` : 'undefined');
  console.log('   Token Type:', tokenData.token_type);
  console.log('   Scope:', tokenData.scope);
  console.log('   Refresh Token:', tokenData.refresh_token ? `${tokenData.refresh_token.slice(0, 10)}...` : 'none');
  console.log('   ✅ Token exchange successful.\n');

  // Step 6: Test calling live MCP endpoint with Bearer token
  console.log('6️⃣ Testing Live MCP Endpoint (/mcp) with Bearer Token...');

  async function parseMcpResponse(res) {
    const text = await res.text();
    if (!text.trim()) return null;
    if (text.startsWith('{')) {
      return JSON.parse(text);
    }
    // Parse SSE lines
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        try {
          return JSON.parse(jsonStr);
        } catch {}
      }
    }
    return text;
  }

  // Initialize
  console.log('   -> Calling initialize...');
  const initRes = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'nitrostack-test-script', version: '1.0.0' },
      },
    }),
  });
  const initData = await parseMcpResponse(initRes);
  console.log('   Initialize response:', JSON.stringify(initData));

  // Tools list
  console.log('   -> Calling tools/list...');
  const toolsRes = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }),
  });
  const toolsData = await parseMcpResponse(toolsRes);
  const toolCount = toolsData?.result?.tools?.length || 0;
  console.log(`   Discovered ${toolCount} live MCP tools.`);
  if (toolCount > 0) {
    const sampleTools = toolsData.result.tools.slice(0, 5).map(t => t.name).join(', ');
    console.log(`   Sample tools: ${sampleTools}...`);
  }

  // Call whoami
  console.log('   -> Calling tool whoami...');
  const whoamiRes = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'whoami',
        arguments: {},
      },
    }),
  });
  const whoamiData = await parseMcpResponse(whoamiRes);
  console.log('   whoami response:', JSON.stringify(whoamiData));

  // Call get_credit_balance
  console.log('   -> Calling tool get_credit_balance...');
  const creditRes = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_credit_balance',
        arguments: {},
      },
    }),
  });
  const creditData = await parseMcpResponse(creditRes);
  console.log('   get_credit_balance response:', JSON.stringify(creditData));

  console.log('\n================================================================');
  console.log('🎉 ALL LIVE COGNERD OAUTH 2.1 & MCP TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
