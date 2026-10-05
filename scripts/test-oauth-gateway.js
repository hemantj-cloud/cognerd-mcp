import http from 'http';
import crypto from 'crypto';
import express from 'express';
import { createOAuthGatewayRouter } from '../dist/services/oauth-gateway.service.js';

async function runTest() {
  console.log('================================================================');
  console.log('🧪 Testing CogNerd OAuth 2.1 Gateway (DCR, CIMD, PKCE & Tokens)');
  console.log('================================================================');

  const app = express();
  app.use(createOAuthGatewayRouter());

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3456, '127.0.0.1', resolve));
  const baseUrl = 'http://127.0.0.1:3456';

  let failed = 0;

  try {
    // 1. Discovery - Authorization Server (RFC 8414)
    console.log('\n1️⃣ Checking /.well-known/oauth-authorization-server (CIMD & DCR)...');
    const authServerRes = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
    const asMeta = await authServerRes.json();
    console.log('   Issuer:', asMeta.issuer);
    console.log('   CIMD supported:', asMeta.client_id_metadata_document_supported);
    console.log('   DCR registration_endpoint:', asMeta.registration_endpoint);
    console.log('   Authorize endpoint:', asMeta.authorization_endpoint);
    console.log('   Token endpoint:', asMeta.token_endpoint);

    if (asMeta.client_id_metadata_document_supported !== true) {
      console.error('   ❌ CIMD client_id_metadata_document_supported is NOT true!');
      failed++;
    } else {
      console.log('   ✅ CIMD advertised correctly.');
    }

    if (!asMeta.registration_endpoint) {
      console.error('   ❌ Missing registration_endpoint!');
      failed++;
    } else {
      console.log('   ✅ DCR registration_endpoint advertised correctly.');
    }

    // 2. Discovery - Protected Resource (RFC 9728)
    console.log('\n2️⃣ Checking /.well-known/oauth-protected-resource...');
    const protRes = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
    const prMeta = await protRes.json();
    console.log('   Resource:', prMeta.resource);
    console.log('   Authorization servers:', prMeta.authorization_servers);
    if (!prMeta.authorization_servers || prMeta.authorization_servers.length === 0) {
      console.error('   ❌ Missing authorization_servers in protected-resource metadata!');
      failed++;
    } else {
      console.log('   ✅ Protected resource metadata verified.');
    }

    // 3. Dynamic Client Registration (RFC 7591)
    console.log('\n3️⃣ Testing Dynamic Client Registration (POST /oauth/v2/register)...');
    const regPayload = {
      client_name: 'ChatGPT Connector',
      redirect_uris: ['https://chatgpt.com/connector/oauth/TFq2vxLFqDc-'],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    };
    const regRes = await fetch(`${baseUrl}/oauth/v2/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });
    const regData = await regRes.json();
    console.log('   DCR Status:', regRes.status);
    console.log('   Registered client_id:', regData.client_id);
    console.log('   Registered redirect_uris:', regData.redirect_uris);

    if (regRes.status !== 201 || !regData.client_id) {
      console.error('   ❌ Dynamic client registration failed!');
      failed++;
    } else {
      console.log('   ✅ DCR passed cleanly.');
    }

    // 4. PKCE Generation & Authorization Request
    console.log('\n4️⃣ Testing Authorization Flow with PKCE (S256)...');
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const state = 'chatgpt-test-state-12345';
    const redirectUri = 'https://chatgpt.com/connector/oauth/TFq2vxLFqDc-';

    // GET /oauth/v2/authorize (HTML render test)
    const authGetUrl = `${baseUrl}/oauth/v2/authorize?client_id=${regData.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;
    const authGetRes = await fetch(authGetUrl);
    const htmlText = await authGetRes.text();
    if (htmlText.includes('Connect to ChatGPT') && htmlText.includes('CogNerd MCP Gateway')) {
      console.log('   ✅ Authorize HTML login page rendered successfully.');
    } else {
      console.error('   ❌ Authorize HTML page failed to render expected content.');
      failed++;
    }

    // POST /oauth/v2/authorize (Submit with live token)
    const validLiveToken = 'QlRIJWMoO5qEUEnNwLmKFX4LEz1i3axx.c0ocggccnZmG4Tmen1ZYRSCe1D4ZVt7VVeG4WWFE1vk%3D';
    const authPostRes = await fetch(`${baseUrl}/oauth/v2/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: regData.client_id,
        redirect_uri: redirectUri,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: state,
        token: validLiveToken,
      }).toString(),
      redirect: 'manual', // do not follow redirect, inspect 302
    });

    console.log('   Authorize POST status:', authPostRes.status);
    const location = authPostRes.headers.get('location');
    console.log('   302 Redirect Location:', location);

    if (authPostRes.status !== 302 || !location) {
      console.error('   ❌ Authorization approval did not return 302 redirect!');
      failed++;
      server.close();
      return;
    }

    const redirectUrlObj = new URL(location);
    const code = redirectUrlObj.searchParams.get('code');
    const returnedState = redirectUrlObj.searchParams.get('state');
    console.log('   Issued Authorization Code:', code?.slice(0, 16) + '...');
    console.log('   State preserved:', returnedState === state);

    if (!code || returnedState !== state) {
      console.error('   ❌ Code or state missing in redirect!');
      failed++;
    } else {
      console.log('   ✅ Authorization code issued & state preserved.');
    }

    // 5. Token Exchange (POST /oauth/v2/token)
    console.log('\n5️⃣ Testing Token Exchange (POST /oauth/v2/token)...');
    const tokenRes = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        code_verifier: verifier,
        client_id: regData.client_id,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    console.log('   Token Response Status:', tokenRes.status);
    console.log('   access_token prefix:', tokenData.access_token ? tokenData.access_token.slice(0, 20) + '...' : 'none');
    console.log('   token_type:', tokenData.token_type);
    console.log('   expires_in:', tokenData.expires_in);

    if (tokenRes.status === 200 && tokenData.access_token) {
      console.log('   ✅ PKCE verification passed & Bearer token issued!');
    } else {
      console.error('   ❌ Token exchange failed:', tokenData);
      failed++;
    }

    // 6. Test PKCE Rejection on wrong verifier
    console.log('\n6️⃣ Testing PKCE Rejection on invalid verifier...');
    // Generate a fresh code
    const authPostRes2 = await fetch(`${baseUrl}/oauth/v2/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: regData.client_id,
        redirect_uri: redirectUri,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: state,
        token: validLiveToken,
      }).toString(),
      redirect: 'manual',
    });
    const code2 = new URL(authPostRes2.headers.get('location')).searchParams.get('code');

    const badTokenRes = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code2,
        code_verifier: 'invalid-verifier-that-does-not-match',
        client_id: regData.client_id,
        redirect_uri: redirectUri,
      }).toString(),
    });
    const badTokenData = await badTokenRes.json();
    console.log('   Bad verifier status:', badTokenRes.status, 'Error:', badTokenData.error);
    if (badTokenRes.status === 400 && badTokenData.error === 'invalid_grant') {
      console.log('   ✅ Bad PKCE verifier correctly rejected.');
    } else {
      console.error('   ❌ Bad PKCE verifier was NOT rejected properly!');
      failed++;
    }

    console.log('\n================================================================');
    if (failed === 0) {
      console.log('🎉 ALL OAUTH 2.1 GATEWAY TESTS PASSED (DCR, CIMD, PKCE, TOKENS)!');
    } else {
      console.error(`💥 FAILED: ${failed} tests failed.`);
    }
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
