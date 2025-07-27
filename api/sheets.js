// api/sheets.js - Vercel serverless function
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sheetId, sheetName = 'Sheet1', range = 'A1:Z100' } = req.query;

    if (!sheetId) {
      return res.status(400).json({ error: 'sheetId parameter is required' });
    }

    let credentials;

    // Try to read from environment variables first
    if (process.env.GOOGLE_CLIENT_EMAIL) {
      credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
        universe_domain: 'googleapis.com'
      };
    } else {
      // Fallback: try to read from config.json file
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        const configFile = fs.readFileSync(configPath, 'utf8');
        credentials = JSON.parse(configFile);
      } catch (fileError) {
        return res.status(500).json({ 
          error: 'No service account credentials found',
          details: 'Please set environment variables or provide config.json file'
        });
      }
    }

    console.log('Using credentials for:', credentials.client_email);

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const fullRange = sheetName ? `${sheetName}!${range}` : range;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: fullRange,
    });

    return res.status(200).json({
      range: response.data.range,
      values: response.data.values || [],
      majorDimension: response.data.majorDimension,
      success: true
    });

  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch sheet data - check permissions and sheet ID'
    });
  }
};