import { McpApplicationFactory, DIContainer, OAuthModule } from '@nitrostack/core';
import { AppModule } from '../dist/app.module.js';
import { setupOAuthGateway } from '../dist/services/oauth-gateway.service.js';
import crypto from 'crypto';

async function runChatGPTFlowTest() {
  console.log('================================================================');
  console.log('🤖 Simulating Complete ChatGPT Connector E2E Lifecycle');
  console.log('================================================================');

  process.env.PORT = '3678';
  const server = await McpApplicationFactory.create(AppModule);
  if (!OAuthModule.getConfig()) {
    DIContainer.getInstance().registerValue(OAuthModule, Object.create(null));
  }
  await server.start();
  const app = server.getHttpTransport().getApp();
  setupOAuthGateway(app);

  const baseUrl = 'http://127.0.0.1:3678';

  try {
    // 1. ChatGPT fetches Discovery Metadata
    console.log('\n1️⃣ ChatGPT fetches Discovery Metadata...');
    const discoRes = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
    const discoData = await discoRes.json();
    console.log('   Issuer:', discoData.issuer);
    console.log('   Registration Endpoint:', discoData.registration_endpoint);
    console.log('   Authorize Endpoint:', discoData.authorization_endpoint);
    console.log('   Token Endpoint:', discoData.token_endpoint);

    // 2. ChatGPT registers dynamically (RFC 7591)
    console.log('\n2️⃣ ChatGPT performs Dynamic Client Registration (DCR)...');
    const dcrRes = await fetch(`${baseUrl}/oauth/v2/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'ChatGPT CogNerd Connector',
        redirect_uris: ['https://chatgpt.com/connector/oauth/test-connector-id'],
      }),
    });
    const dcrData = await dcrRes.json();
    console.log('   Registered client_id:', dcrData.client_id);

    // 3. User authorizes via PKCE
    console.log('\n3️⃣ User authorizes via PKCE S256...');
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const state = 'oauth_state_' + Date.now();
    const redirectUri = 'https://chatgpt.com/connector/oauth/test-connector-id';

    const authPostRes = await fetch(`${baseUrl}/oauth/v2/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: dcrData.client_id,
        redirect_uri: redirectUri,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: state,
        email: 'hub+nitrostack@cognerd.ai',
        password: '2TSLtgT^g56hLj5GK*9-',
      }).toString(),
      redirect: 'manual',
    });

    const location = authPostRes.headers.get('location');
    console.log('   Authorize Redirect Location:', location);
    const code = new URL(location).searchParams.get('code');
    console.log('   Extracted authorization code:', code.slice(0, 16) + '...');

    // 4. ChatGPT exchanges code for Bearer Token
    console.log('\n4️⃣ ChatGPT exchanges code for Bearer Token...');
    const tokenRes = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        code_verifier: verifier,
        client_id: dcrData.client_id,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    console.log('   Token Response Status:', tokenRes.status);
    console.log('   Bearer Token:', tokenData.access_token.slice(0, 25) + '...');
    const accessToken = tokenData.access_token;

    // 5. ChatGPT fetches tools/list on /mcp
    console.log('\n5️⃣ ChatGPT calls tools/list on /mcp...');
    const toolsListRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'req-tools-list-1',
        method: 'tools/list',
        params: {},
      }),
    });

    console.log('   tools/list Status:', toolsListRes.status);
    console.log('   Content-Type:', toolsListRes.headers.get('content-type'));
    const listBody = await toolsListRes.text();
    console.log('   Response size:', listBody.length, 'bytes');

    if (toolsListRes.status !== 200 || !listBody.includes('whoami')) {
      throw new Error(`tools/list failed with status ${toolsListRes.status}: ${listBody}`);
    }
    console.log('   ✅ tools/list succeeded with 200 OK and valid tool definitions!');

    // 6. ChatGPT executes tools/call whoami
    console.log('\n6️⃣ ChatGPT executes tools/call whoami...');
    const toolCallRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'req-call-whoami-2',
        method: 'tools/call',
        params: {
          name: 'whoami',
          arguments: {},
        },
      }),
    });

    console.log('   tools/call whoami Status:', toolCallRes.status);
    const callBody = await toolCallRes.text();
    console.log('   tools/call response snippet:', callBody.slice(0, 300));

    if (toolCallRes.status !== 200 || !callBody.includes('NitroStack')) {
      throw new Error(`tools/call whoami failed: ${callBody}`);
    }
    console.log('   ✅ tools/call whoami successfully executed with active brand profile!');

    console.log('\n================================================================');
    console.log('🎉 COMPLETE CHATGPT CONNECTOR LIFECYCLE PASSED 100%!');
    console.log('================================================================');
  } finally {
    process.exit(0);
  }
}

runChatGPTFlowTest().catch((err) => {
  console.error('❌ E2E ChatGPT flow failed:', err);
  process.exit(1);
});
