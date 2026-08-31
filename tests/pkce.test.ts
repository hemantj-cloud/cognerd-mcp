import { describe, it, expect } from 'vitest';
import { generatePkcePair, verifyPkceChallenge } from '../src/auth/pkce.utils.js';

describe('PKCE Utilities (RFC 7636)', () => {
  it('should generate valid code_verifier, code_challenge and state', () => {
    const pkce = generatePkcePair();

    expect(pkce.codeVerifier).toBeDefined();
    expect(pkce.codeChallenge).toBeDefined();
    expect(pkce.state).toBeDefined();
    expect(pkce.codeChallengeMethod).toBe('S256');

    // RFC 7636: Code verifier length should be between 43 and 128 characters
    expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);
  });

  it('should correctly verify challenge against verifier', () => {
    const pkce = generatePkcePair();
    const isValid = verifyPkceChallenge(pkce.codeVerifier, pkce.codeChallenge);
    expect(isValid).toBe(true);

    const isInvalid = verifyPkceChallenge('tampered_verifier_random_data_123456789012345', pkce.codeChallenge);
    expect(isInvalid).toBe(false);
  });
});
