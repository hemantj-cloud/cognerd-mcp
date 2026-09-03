import crypto from 'node:crypto';
import fs from 'node:fs';

const BASE_URL = 'https://mcp-185-131-53-177.sslip.io';
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

async function parseMcpResponse(res) {
  const text = await res.text();
  if (!text.trim()) return null;
  if (text.startsWith('{')) return JSON.parse(text);
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try { return JSON.parse(line.slice(6)); } catch {}
    }
  }
  return text;
}

async function main() {
  console.log('1️⃣ Obtaining live Bearer token...');
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: 'Schema Fetcher', redirect_uris: [REDIRECT_URI] }),
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
  const token = tokenData.access_token;
  console.log('   Obtained Bearer token.');

  console.log('2️⃣ Fetching tools/list schema from CogNerd MCP server...');
  const toolsRes = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }),
  });

  const toolsData = await parseMcpResponse(toolsRes);
  const tools = toolsData?.result?.tools || [];
  console.log(`   Found ${tools.length} tools.`);

  fs.writeFileSync('/Users/admin/Desktop/sales-clients/cognerd/docs/cognerd-tools-schema.json', JSON.stringify(tools, null, 2));
  console.log('   Saved full JSON schema to /Users/admin/Desktop/sales-clients/cognerd/docs/cognerd-tools-schema.json');

  console.log('\n📋 Tool List & Descriptions:');
  tools.forEach((t, i) => {
    console.log(`  ${(i + 1).toString().padStart(2, ' ')}. ${t.name} - ${t.description?.split('.')[0] || 'No description'}`);
  });
}

main().catch(err => console.error('Error:', err));
