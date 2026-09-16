import crypto from 'node:crypto';

const COGNERD_AUTH_URL = 'https://mcp.cognerd.in';
const LOCAL_MCP_URL = 'http://localhost:3000/mcp';
const SANDBOX_EMAIL = 'nitrostack.sandbox@cognerd.ai';
const SANDBOX_PASSWORD = 'VDAPdpRAWFobUhyb';
const REDIRECT_URI = 'http://localhost:3005/auth/callback';

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

async function parseMcpResponse(res) {
  const text = await res.text();
  if (!text.trim()) return null;
  if (text.startsWith('{')) {
    return JSON.parse(text);
  }
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

async function run() {
  console.log('================================================================');
  console.log('🧪 Testing Local CogNerd MCP Server with OAUTH_REQUIRED=true');
  console.log(`📍 Target: ${LOCAL_MCP_URL}`);
  console.log('================================================================\n');

  // Step 1: Obtain a live OAuth Bearer token from CogNerd Authorization Server
  console.log('1️⃣ Obtaining live OAuth token from CogNerd server...');
  
  // Register dynamic client
  const regRes = await fetch(`${COGNERD_AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'NitroStack Local Test Client',
      redirect_uris: [REDIRECT_URI],
    }),
  });
  const clientData = await regRes.json();
  console.log('   Dynamic Client ID:', clientData.client_id);

  // PKCE
  const pkce = generatePkce();

  // Authorize with Sandbox credentials
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

  const authRes = await fetch(`${COGNERD_AUTH_URL}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: authBody.toString(),
    redirect: 'manual',
  });

  const location = authRes.headers.get('location');
  if (!location) {
    throw new Error('Failed to get authorization code redirect');
  }
  const redirectUrl = new URL(location);
  const authCode = redirectUrl.searchParams.get('code');
  console.log('   Authorization code:', authCode);

  // Exchange code for token
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientData.client_id,
    code: authCode,
    redirect_uri: REDIRECT_URI,
    code_verifier: pkce.codeVerifier,
  });

  const tokenRes = await fetch(`${COGNERD_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  console.log('   Obtained Bearer Access Token:', `${accessToken.slice(0, 15)}...`);
  console.log('   ✅ OAuth token successfully generated.\n');

  // Step 2: Initialize MCP Session on Local Server
  console.log('2️⃣ Initializing MCP Session on Local Server (http://localhost:3000/mcp)...');
  const initRes = await fetch(LOCAL_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'nitrostack-local-test', version: '1.0.0' },
      },
    }),
  });

  const sessionId = initRes.headers.get('mcp-session-id');
  const initData = await parseMcpResponse(initRes);
  console.log('   Session ID:', sessionId);
  console.log('   Server Name:', initData?.result?.serverInfo?.name);
  console.log('   ✅ Session initialized.\n');

  // Step 3: Test Unauthenticated Tool Call (Fail-Closed Check)
  console.log('3️⃣ Testing Unauthenticated Tool Call (Should be rejected with 401)...');
  const unauthRes = await fetch(LOCAL_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_ai_insights',
        arguments: {},
      },
    }),
  });

  console.log('   Unauthenticated response HTTP status:', unauthRes.status);
  const wwwAuth = unauthRes.headers.get('www-authenticate');
  console.log('   WWW-Authenticate Header:', wwwAuth);
  const unauthBody = await unauthRes.text();
  console.log('   Response Body:', unauthBody);

  if (unauthRes.status === 401) {
    console.log('   ✅ Pass: Unauthenticated request was correctly rejected (401 Unauthorized).\n');
  } else {
    throw new Error(`Expected 401 Unauthorized but received ${unauthRes.status}`);
  }

  // Step 4: Test Authenticated Tool Call (get_ai_insights)
  console.log('4️⃣ Testing Authenticated Tool Call: get_ai_insights with Bearer Token...');
  const authToolRes = await fetch(LOCAL_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${accessToken}`,
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_ai_insights',
        arguments: {},
      },
    }),
  });

  console.log('   Authenticated response HTTP status:', authToolRes.status);
  const toolResult = await parseMcpResponse(authToolRes);
  console.log('   Tool Execution Result:', JSON.stringify(toolResult).slice(0, 300) + '...');
  
  if (authToolRes.status === 200 && !toolResult?.error) {
    console.log('   ✅ Pass: get_ai_insights successfully executed with Bearer token.\n');
  } else {
    throw new Error(`Authenticated tool call failed: ${JSON.stringify(toolResult)}`);
  }

  // Step 5: Test Authenticated Tool Call: get_audience_personas
  console.log('5️⃣ Testing Authenticated Tool Call: get_audience_personas...');
  const personasRes = await fetch(LOCAL_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${accessToken}`,
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_audience_personas',
        arguments: {},
      },
    }),
  });

  const personasResult = await parseMcpResponse(personasRes);
  console.log('   Personas Result:', JSON.stringify(personasResult).slice(0, 200) + '...');
  if (personasRes.status === 200 && !personasResult?.error) {
    console.log('   ✅ Pass: get_audience_personas successfully executed.\n');
  } else {
    throw new Error(`get_audience_personas call failed: ${JSON.stringify(personasResult)}`);
  }

  console.log('================================================================');
  console.log('🎉 LOCAL SERVER OAUTH ENFORCEMENT & EXECUTION VERIFIED 100%!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('\n❌ Local server test failed:', err);
  process.exit(1);
});
