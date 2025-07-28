// api/sheets.js - Enhanced version with POST/PUT support and config.json fallback
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  let credentials; // Declare at function scope so it's available in error handler
  
  try {
    let credentialsSource = 'unknown';

    // Try to read from environment variables first
    if (process.env.GOOGLE_CLIENT_EMAIL) {
      console.log('Using environment variables for authentication');
      credentialsSource = 'environment';
      
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
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
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
        throw new Error('Invalid GOOGLE_PRIVATE_KEY format - must be a valid PEM format key');
      }

      // Create service account credentials from environment
      credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL)}`,
        universe_domain: 'googleapis.com'
      };
    } else {
      // Fallback: try to read from config.json file
      console.log('Environment variables not found, trying config.json fallback');
      credentialsSource = 'config.json';
      
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        console.log('Looking for config.json at:', configPath);
        
        if (!fs.existsSync(configPath)) {
          throw new Error('config.json file not found');
        }
        
        const configFile = fs.readFileSync(configPath, 'utf8');
        credentials = JSON.parse(configFile);
        
        // Validate required fields in config.json
        const requiredFields = [
          'type', 'project_id', 'private_key_id', 'private_key', 
          'client_email', 'client_id', 'auth_uri', 'token_uri'
        ];
        
        const missingFields = requiredFields.filter(field => !credentials[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields in config.json: ${missingFields.join(', ')}`);
        }
        
        console.log('Successfully loaded credentials from config.json for:', credentials.client_email);
      } catch (fileError) {
        return res.status(500).json({ 
          error: 'No service account credentials found',
          details: 'Please set environment variables or provide config.json file',
          hint: 'For local development, create a config.json file with your service account credentials',
          configPath: path.join(process.cwd(), 'config.json'),
          fileError: fileError.message
        });
      }
    }

    console.log(`Attempting authentication with service account: ${credentials.client_email} (source: ${credentialsSource})`);

    // Initialize Google Auth with appropriate scopes
    const scopes = req.method === 'GET' 
      ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
      : ['https://www.googleapis.com/auth/spreadsheets'];

    const auth = new GoogleAuth({
      credentials,
      scopes
    });

    // Get authenticated client
    const authClient = await auth.getClient();
    
    // Initialize Sheets API
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Handle different HTTP methods
    if (req.method === 'GET') {
      return await handleGet(req, res, sheets);
    } else if (req.method === 'POST') {
      return await handlePost(req, res, sheets);
    } else if (req.method === 'PUT') {
      return await handlePut(req, res, sheets);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Sheets API Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });

    // Provide specific error messages based on error type
    let errorMessage = 'Failed to process request';
    let statusCode = 500;
    let troubleshooting = [];

    if (error.message.includes('invalid_grant')) {
      errorMessage = 'Service account authentication failed';
      statusCode = 401;
      troubleshooting = [
        'Verify the service account exists in Google Cloud Console',
        'Check that the service account email is correct',
        'Ensure the private key matches the service account',
        'Verify the service account has Google Sheets API enabled',
        'Check if config.json has correct service account credentials'
      ];
    } else if (error.message.includes('PERMISSION_DENIED') || error.code === 403) {
      errorMessage = 'Permission denied - service account cannot access spreadsheet';
      statusCode = 403;
      troubleshooting = [
        'Share the Google Sheet with your service account email',
        'Give the service account at least "Editor" permissions for write operations',
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
    } else if (error.message.includes('config.json') || error.message.includes('environment variables')) {
      errorMessage = 'Configuration error';
      statusCode = 500;
      troubleshooting = [
        'For production: Set environment variables in Vercel/deployment platform',
        'For local development: Create config.json with service account credentials',
        'Ensure all required fields are present in your configuration'
      ];
    }

    return res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      troubleshooting,
      timestamp: new Date().toISOString(),
      serviceAccount: credentials?.client_email || 'unknown'
    });
  }
};

// Handle GET requests (read data)
async function handleGet(req, res, sheets) {
  const { sheetId, sheetName = 'Sheet1', range = 'A1:Z200' } = req.query;
  
  if (!sheetId) {
    return res.status(400).json({ error: 'sheetId parameter is required' });
  }

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
}

// Handle POST requests (append data)
async function handlePost(req, res, sheets) {
  const { spreadsheetId, sheetName, values } = req.body;
  
  if (!spreadsheetId || !sheetName || !values) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['spreadsheetId', 'sheetName', 'values']
    });
  }

  if (!Array.isArray(values) || values.length === 0) {
    return res.status(400).json({ error: 'values must be a non-empty array' });
  }

  console.log(`Appending data to spreadsheet: ${spreadsheetId}, sheet: ${sheetName}`);
  
  const range = `${sheetName}!A:A`; // Append to the end
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: values
    }
  });

  console.log(`Successfully appended ${values.length} row(s) to ${sheetName}`);

  return res.status(200).json({
    success: true,
    updatedRange: response.data.updates?.updatedRange,
    updatedRows: response.data.updates?.updatedRows,
    updatedColumns: response.data.updates?.updatedColumns,
    updatedCells: response.data.updates?.updatedCells,
    metadata: {
      spreadsheetId,
      sheetName,
      appendedRows: values.length
    }
  });
}

// Handle PUT requests (update data)
async function handlePut(req, res, sheets) {
  const { spreadsheetId, range, values } = req.body;
  
  if (!spreadsheetId || !range || !values) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['spreadsheetId', 'range', 'values']
    });
  }

  if (!Array.isArray(values) || values.length === 0) {
    return res.status(400).json({ error: 'values must be a non-empty array' });
  }

  console.log(`Updating data in spreadsheet: ${spreadsheetId}, range: ${range}`);
  
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: values
    }
  });

  console.log(`Successfully updated ${values.length} row(s) in range ${range}`);

  return res.status(200).json({
    success: true,
    updatedRange: response.data.updatedRange,
    updatedRows: response.data.updatedRows,
    updatedColumns: response.data.updatedColumns,
    updatedCells: response.data.updatedCells,
    metadata: {
      spreadsheetId,
      range,
      updatedRows: values.length
    }
  });
}
