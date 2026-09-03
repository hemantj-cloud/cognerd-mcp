import { z } from 'zod';

export const OAuthTokenResponseSchema = z.object({
  access_token: z.string().describe('Opaque Bearer access token'),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().optional().default(30 * 24 * 60 * 60).describe('Token expiration time in seconds'),
  scope: z.string().optional().default('cognerd').describe('Granted scopes'),
  refresh_token: z.string().optional().describe('Refresh token'),
});

export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;

