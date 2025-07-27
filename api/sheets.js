const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  // CORS headers (keep your existing ones)
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { sheetId, sheetName = 'Sheet1', range = 'A1:Z100' } = req.query;
    if (!sheetId) return res.status(400).json({ error: 'sheetId parameter is required' });

    // 1. Enhanced credential handling
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
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

    console.log('Service Account:', credentials.client_email);
    console.log('Private Key Format Valid:', privateKey.includes('BEGIN PRIVATE KEY'));

    // 2. Modified auth initialization
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      clientOptions: {
        subject: credentials.client_email // Explicitly set the subject
      }
    });

    // 3. Direct JWT client creation
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!${range}`,
    });

    return res.status(200).json({
      range: response.data.range,
      values: response.data.values || [],
      success: true
    });

  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: error.response?.data?.error_description || error.message
    });
  }
};
