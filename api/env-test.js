// Add this as a new API route (api/env-test.js)
export default function handler(req, res) {
  res.status(200).json({
    GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_PRIVATE_KEY_ID: !!process.env.GOOGLE_PRIVATE_KEY_ID,
    GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    NODE_ENV: process.env.NODE_ENV
  });
}
