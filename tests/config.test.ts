import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config/cognerd.config.js';

describe('CogNerd Configuration Loader', () => {
  const mockEnv: NodeJS.ProcessEnv = {
    RESOURCE_URI: 'https://mcp.cognerd.ai',
    AUTH_SERVER_URL: 'https://auth.cognerd.ai',
    OAUTH_REQUIRED: 'false',
    COGNERD_API_BASE_URL: 'https://api.cognerd.ai',
    COGNERD_SCOPE: 'read:visibility write:visibility admin',
  };

  it('should successfully load valid configuration with defaults', () => {
    const config = loadConfig(mockEnv);

    expect(config.resourceUri).toBe('https://mcp.cognerd.ai');
    expect(config.authServerUrl).toBe('https://auth.cognerd.ai');
    expect(config.oauthRequired).toBe(false);
    expect(config.scopesSupported).toEqual(['read:visibility', 'write:visibility', 'admin']);
    expect(config.codeChallengeMethod).toBe('S256');
  });

  it('should throw an error if RESOURCE_URI is missing', () => {
    const invalidEnv = { ...mockEnv };
    delete invalidEnv.RESOURCE_URI;

    expect(() => loadConfig(invalidEnv)).toThrow(/RESOURCE_URI/);
  });

  it('should throw an error if AUTH_SERVER_URL is invalid URL', () => {
    const invalidEnv = { ...mockEnv, AUTH_SERVER_URL: 'not-a-valid-url' };

    expect(() => loadConfig(invalidEnv)).toThrow(/AUTH_SERVER_URL/);
  });
});
