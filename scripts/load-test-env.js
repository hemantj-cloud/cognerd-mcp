import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const testEnvPath = path.join(rootDir, '.env.test');
const defaultEnvPath = path.join(rootDir, '.env');

// First load .env (defaults) then .env.test (overrides for testing)
if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
}
if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath, override: true });
}

export const TEST_CONFIG = {
  baseUrl: process.env.COGNERD_API_BASE_URL || process.env.AUTH_SERVER_URL || 'https://mcp.cognerd.in',
  email: process.env.TEST_COGNERD_EMAIL || process.env.COGNERD_SANDBOX_EMAIL || '',
  password: process.env.TEST_COGNERD_PASSWORD || process.env.COGNERD_SANDBOX_PASSWORD || '',
  redirectUri: process.env.COGNERD_REDIRECT_URI || 'http://localhost:3005/auth/callback',
};
