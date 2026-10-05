import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config/cognerd.config.js';

describe('CogNerd Configuration Loader', () => {
  const mockEnv: NodeJS.ProcessEnv = {
    RESOURCE_URI: 'https://api.cognerd.in/mcp',
    AUTH_SERVER_URL: 'https://api.cognerd.in',
    OAUTH_REQUIRED: 'false',
    COGNERD_API_BASE_URL: 'https://api.cognerd.in',
    COGNERD_SCOPE: 'cognerd',
  };

  it('should successfully load valid configuration with defaults', () => {
    const config = loadConfig(mockEnv);

    expect(config.resourceUri).toBe('https://api.cognerd.in/mcp');
    expect(config.authServerUrl).toBe('https://api.cognerd.in');
    expect(config.oauthRequired).toBe(false);
    expect(config.scopesSupported).toEqual(['cognerd']);
    expect(config.codeChallengeMethod).toBe('S256');
    expect(config.authUrl).toBe('https://api.cognerd.in/authorize');
    expect(config.tokenUrl).toBe('https://api.cognerd.in/token');
  });

  it('should fallback to default cognerd scope when not provided', () => {
    const envWithoutScope: NodeJS.ProcessEnv = {
      RESOURCE_URI: 'https://api.cognerd.in/mcp',
      AUTH_SERVER_URL: 'https://api.cognerd.in',
    };
    const config = loadConfig(envWithoutScope);
    expect(config.scopesSupported).toEqual(['cognerd']);
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
