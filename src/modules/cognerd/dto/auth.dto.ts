import { z } from 'zod';

export const OAuthTokenResponseSchema = z.object({
  access_token: z.string().describe('Opaque Bearer access token'),
  token_type: z.literal('Bearer').default('Bearer'),
  expires_in: z.number().describe('Token expiration time in seconds'),
  scope: z.string().describe('Granted scopes (space-separated)'),
});

export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;
