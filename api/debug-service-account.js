// api/verify-service-account.js
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {}
  };

  try {
    // 1. Check environment variables
    results.checks.environmentVariables = {
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasPrivateKeyId: !!process.env.GOOGLE_PRIVATE_KEY_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL || 'NOT_SET',
      projectId: process.env.GOOGLE_PROJECT_ID || 'NOT_SET',
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
      privateKeyStartsWith: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 30) || 'NOT_SET'
    };

    // 2. Validate private key format
    let privateKey;
    try {
      privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      results.checks.privateKeyValidation = {
        hasBeginMarker: privateKey?.includes('-----BEGIN PRIVATE KEY-----') || false,
        hasEndMarker: privateKey?.includes('-----END PRIVATE KEY-----') || false,
        formatValid: privateKey?.includes('-----BEGIN PRIVATE KEY-----') && privateKey?.includes('-----END PRIVATE KEY-----'),
        cleanedLength: privateKey?.length || 0
      };
    } catch (error) {
      results.checks.privateKeyValidation = {
        error: error.message,
        formatValid: false
      };
    }

    // 3. Test credential object creation
    try {
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

      results.checks.credentialCreation = {
        success: true,
        credentialKeys: Object.keys(credentials),
        hasAllRequiredFields: !!(credentials.client_email && credentials.private_key && credentials.project_id)
      };

      // 4. Test GoogleAuth initialization
      try {
        const auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        results.checks.authInitialization = {
          success: true,
          message: 'GoogleAuth object created successfully'
        };

        // 5. Test getting auth client (this is where "account not found" usually fails)
        try {
          const authClient = await auth.getClient();
          
          results.checks.authClientCreation = {
            success: true,
            clientType: authClient.constructor.name,
            message: 'Auth client created successfully'
          };

          // 6. Test API access with a simple call
          try {
            const sheets = google.sheets({ version: 'v4', auth: authClient });
            
            // Try to access the first spreadsheet ID from environment
            const testSpreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_EMPLOYEES || 
                                    process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_FMS || 
                                    process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_DELEGATION;

            if (testSpreadsheetId) {
              try {
                const response = await sheets.spreadsheets.get({
                  spreadsheetId: testSpreadsheetId
                });

                results.checks.sheetsApiAccess = {
                  success: true,
                  spreadsheetTitle: response.data.properties.title,
                  sheetCount: response.data.sheets.length,
                  message: 'Successfully accessed Google Sheets API'
                };
              } catch (apiError) {
                results.checks.sheetsApiAccess = {
                  success: false,
                  error: apiError.message,
                  code: apiError.code,
                  status: apiError.status,
                  spreadsheetId: testSpreadsheetId
                };
              }
            } else {
              results.checks.sheetsApiAccess = {
                success: false,
                error: 'No test spreadsheet ID found in environment variables'
              };
            }

          } catch (sheetsError) {
            results.checks.sheetsApiAccess = {
              success: false,
              error: sheetsError.message,
              code: sheetsError.code
            };
          }

        } catch (clientError) {
          results.checks.authClientCreation = {
            success: false,
            error: clientError.message,
            code: clientError.code,
            details: clientError.response?.data
          };
        }

      } catch (authError) {
        results.checks.authInitialization = {
          success: false,
          error: authError.message,
          code: authError.code
        };
      }

    } catch (credError) {
      results.checks.credentialCreation = {
        success: false,
        error: credError.message
      };
    }

    // 7. Generate recommendations based on results
    results.recommendations = [];

    if (!results.checks.environmentVariables.hasClientEmail) {
      results.recommendations.push('Set GOOGLE_CLIENT_EMAIL environment variable');
    }
    if (!results.checks.environmentVariables.hasPrivateKey) {
      results.recommendations.push('Set GOOGLE_PRIVATE_KEY environment variable');
    }
    if (!results.checks.privateKeyValidation?.formatValid) {
      results.recommendations.push('Fix private key format - ensure it includes BEGIN/END markers and proper line breaks');
    }
    if (results.checks.authClientCreation && !results.checks.authClientCreation.success) {
      if (results.checks.authClientCreation.error?.includes('invalid_grant')) {
        results.recommendations.push('Service account not found - verify it exists in Google Cloud Console');
        results.recommendations.push('Ensure service account email matches exactly');
        results.recommendations.push('Check that private key belongs to this service account');
      }
    }
    if (results.checks.sheetsApiAccess && !results.checks.sheetsApiAccess.success) {
      if (results.checks.sheetsApiAccess.error?.includes('PERMISSION_DENIED')) {
        results.recommendations.push('Share Google Sheets with service account email');
        results.recommendations.push('Ensure service account has at least Viewer permissions');
      }
    }

    // Overall status
    results.overallStatus = results.checks.authClientCreation?.success ? 'SUCCESS' : 'FAILURE';
    results.canAccessSheets = results.checks.sheetsApiAccess?.success || false;

    return res.status(200).json(results);

  } catch (error) {
    results.checks.unexpectedError = {
      error: error.message,
      stack: error.stack
    };
    results.overallStatus = 'ERROR';
    
    return res.status(500).json(results);
  }
};
