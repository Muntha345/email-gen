console.log(JSON.stringify({
  EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  ID: process.env.GOOGLE_SPREADSHEET_ID
}));
