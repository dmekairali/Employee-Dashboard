// api/sheets.js - Fixed version with better error handling
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { sheetId, sheetName = 'Sheet1', range = 'A1:Z100' } = req.query;
    
    if (!sheetId) {
      return res.status(400).json({ error: 'sheetId parameter is required' });
    }

    // Validate all required environment variables
    const requiredEnvVars = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_PROJECT_ID',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_PRIVATE_KEY_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      return res.status(500).json({ 
        error: 'Missing required environment variables',
        missing: missingVars,
        hint: 'Check your Vercel environment variables configuration'
      });
    }

    // Clean and validate private key
    let privateKey;
    try {
      privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      // Validate private key format
      if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
        throw new Error('Invalid private key format');
      }
    } catch (keyError) {
      return res.status(500).json({ 
        error: 'Invalid GOOGLE_PRIVATE_KEY format',
        details: 'Private key must be a valid PEM format key',
        hint: 'Ensure the private key includes -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----'
      });
    }

    // Create service account credentials
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL)}`
    };

    console.log('Attempting authentication with service account:', credentials.client_email);

    // Initialize Google Auth
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    // Get authenticated client
    const authClient = await auth.getClient();
    
    // Initialize Sheets API
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Make the API call
    console.log(`Fetching data from spreadsheet: ${sheetId}, sheet: ${sheetName}, range: ${range}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!${range}`,
    });

    console.log(`Successfully retrieved ${response.data.values?.length || 0} rows`);

    return res.status(200).json({
      range: response.data.range,
      values: response.data.values || [],
      success: true,
      metadata: {
        spreadsheetId: sheetId,
        sheetName: sheetName,
        requestedRange: range,
        actualRange: response.data.range,
        rowCount: response.data.values?.length || 0
      }
    });

  } catch (error) {
    console.error('Sheets API Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });

    // Provide specific error messages based on error type
    let errorMessage = 'Failed to fetch spreadsheet data';
    let statusCode = 500;
    let troubleshooting = [];

    if (error.message.includes('invalid_grant')) {
      errorMessage = 'Service account authentication failed';
      statusCode = 401;
      troubleshooting = [
        'Verify the service account exists in Google Cloud Console',
        'Check that the service account email is correct',
        'Ensure the private key matches the service account',
        'Verify the service account has Google Sheets API enabled'
      ];
    } else if (error.message.includes('PERMISSION_DENIED') || error.code === 403) {
      errorMessage = 'Permission denied - service account cannot access spreadsheet';
      statusCode = 403;
      troubleshooting = [
        'Share the Google Sheet with your service account email',
        'Give the service account at least "Viewer" permissions',
        'Check if the spreadsheet ID is correct',
        'Verify the sheet name exists in the spreadsheet'
      ];
    } else if (error.message.includes('NOT_FOUND') || error.code === 404) {
      errorMessage = 'Spreadsheet or sheet not found';
      statusCode = 404;
      troubleshooting = [
        'Verify the spreadsheet ID is correct',
        'Check that the sheet name exists',
        'Ensure the spreadsheet is not deleted'
      ];
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'Google Sheets API quota exceeded';
      statusCode = 429;
      troubleshooting = [
        'Wait before making more requests',
        'Check your Google Cloud Console quotas',
        'Consider implementing request throttling'
      ];
    }

    return res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      troubleshooting,
      timestamp: new Date().toISOString(),
      // Include service account email for debugging (but not private key)
      serviceAccount: process.env.GOOGLE_CLIENT_EMAIL
    });
  }
};
