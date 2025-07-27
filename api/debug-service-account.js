// Add this temporary debug endpoint to check your service account
// api/debug-service-account.js

module.exports = async function handler(req, res) {
  // Allow in production for troubleshooting (remove after fixing)
  // if (process.env.NODE_ENV === 'production') {
  //   return res.status(403).json({ error: 'Debug endpoint disabled in production' });
  // }

  try {
    // Check what environment variables we have
    const envVars = {
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_PRIVATE_KEY_ID: process.env.GOOGLE_PRIVATE_KEY_ID,
      HAS_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      PRIVATE_KEY_STARTS_WITH: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 50) + '...',
    };

    return res.status(200).json({
      message: 'Service Account Debug Info',
      environment: envVars,
      expectedServiceAccount: 'empdashboard@mrvitsts.iam.gserviceaccount.com',
      troubleshooting: {
        step1: 'Verify the service account exists in Google Cloud Console',
        step2: 'Check if service account has Google Sheets API access',
        step3: 'Ensure service account is shared with your Google Sheets',
        step4: 'Verify all environment variables are correctly set'
      }
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Debug failed',
      details: error.message
    });
  }
};
