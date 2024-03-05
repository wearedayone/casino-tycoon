import { google } from 'googleapis';
import path from 'path';

import environments from '../utils/environments.js';
const { ENVIRONMENT } = environments;

const credentialsJson =
  ENVIRONMENT === 'production'
    ? 'casino-tycoon-production.json'
    : ENVIRONMENT === 'staging'
    ? 'casino-tycoon-staging.json'
    : ENVIRONMENT === 'demo'
    ? 'casino-tycoon-demo.json'
    : 'casino-tycoon.json';
const CREDENTIALS_PATH = path.join(process.cwd(), `serviceAccounts/${credentialsJson}`);

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

export const sheets = google.sheets({ version: 'v4', auth });
