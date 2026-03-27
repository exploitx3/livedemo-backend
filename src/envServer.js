//TODO: refactor to get the vars from ENV vars
export default {
  'ENV': process.env.ENV ? process.env.ENV : "",
  'URL': process.env.APIG_URL ? process.env.APIG_URL : "",
  'ENABLE_API': process.env.ENABLE_API !== undefined ? process.env.ENABLE_API.toLowerCase() === 'true' : "",
  'ENABLE_CONSUMER': process.env.ENABLE_CONSUMER !== undefined ? process.env.ENABLE_CONSUMER.toLowerCase() === 'true' : "",
  'URL_CLEAN': process.env.URL_CLEAN ? process.env.URL_CLEAN : "",
  'URL_COMMON_DOMAIN': process.env.URL_COMMON_DOMAIN ? process.env.URL_COMMON_DOMAIN : "",
  'SERVER_URL': process.env.SERVER_URL ? process.env.SERVER_URL : "",
  'INJECT_BUNDLE_HOST': process.env.INJECT_BUNDLE_HOST ? process.env.INJECT_BUNDLE_HOST : "",
  'PRIVATE_AUTH_TOKEN': process.env.PRIVATE_AUTH_TOKEN ? process.env.PRIVATE_AUTH_TOKEN : "",
  'DB_URI': process.env.DB_URI ? process.env.DB_URI : "",
  'DEMOS_FOLDER': process.env.DEMOS_FOLDER ? process.env.DEMOS_FOLDER : "",
  'STORIES_FOLDER': process.env.STORIES_FOLDER ? process.env.STORIES_FOLDER : "",
  'STORY_REQUESTS_FOLDER': process.env.STORY_REQUESTS_FOLDER ? process.env.STORY_REQUESTS_FOLDER : "",
  'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID : "",
  'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY : "",
  'STORY_API': process.env.STORY_API ? process.env.STORY_API : "",
  'STORIES_API': process.env.STORIES_API ? process.env.STORIES_API : "",
  'CAPTCHA_SECRET_KEY':  process.env.CAPTCHA_SECRET_KEY ? process.env.CAPTCHA_SECRET_KEY : "",
  'MUX_TOKEN_ID': process.env.MUX_TOKEN_ID ? process.env.MUX_TOKEN_ID : "",
  'MUX_TOKEN_SECRET': process.env.MUX_TOKEN_SECRET ? process.env.MUX_TOKEN_SECRET : "",
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY : "",
  'LIVEDEMO_CDN_URL':  process.env.LIVEDEMO_CDN_URL ? process.env.LIVEDEMO_CDN_URL : "",
  'REQUESTS_PER_INTERVAL':  process.env.REQUESTS_PER_INTERVAL ? process.env.REQUESTS_PER_INTERVAL : "",
  'ELEVENLABS_API_KEY':  process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY : "",
  'ELEVENLABS_VOICES_COLLECTION':  process.env.ELEVENLABS_VOICES_COLLECTION ? process.env.ELEVENLABS_VOICES_COLLECTION : "",
  'SES_ACCESS_KEY_ID': process.env.SES_ACCESS_KEY_ID ? process.env.SES_ACCESS_KEY_ID : "",
  'SES_SECRET_ACCESS_KEY': process.env.SES_SECRET_ACCESS_KEY ? process.env.SES_SECRET_ACCESS_KEY : "",
  'GMAIL': {
    CLIENT_ID: process.env.GMAIL__CLIENT_ID,
    CLIENT_SECRET: process.env.GMAIL__CLIENT_SECRET,
    REDIRECT_URIS: process.env.GMAIL__REDIRECT_URIS ? JSON.parse(process.env.GMAIL__REDIRECT_URIS) : ""
  },
  'OAUTH2Credentials': (() => {
    // Parse OAUTH2Credentials from env if it exists, otherwise use empty defaults.
    const oauth2Creds = process.env.OAUTH2Credentials 
      ? JSON.parse(process.env.OAUTH2Credentials) 
      : {}
    
    // Always merge HubSpot credentials from separate env vars
    oauth2Creds.HubSpot = {
      "client_id": process.env.HUBSPOT__CLIENT_ID ? process.env.HUBSPOT__CLIENT_ID : "",
      "client_secret": process.env.HUBSPOT__CLIENT_SECRET ? process.env.HUBSPOT__CLIENT_SECRET : "",
      "redirect_uris": process.env.HUBSPOT__REDIRECT_URIS ? JSON.parse(process.env.HUBSPOT__REDIRECT_URIS) : [
        ""
      ]
    }
    
    return oauth2Creds
  })(),
  'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY : "",
  'TMP_FOLDER': process.env.TMP_FOLDER ? process.env.TMP_FOLDER : "",
  'PROCESS_DEMO_ACTIVITY_EVENTS': process.env.PROCESS_DEMO_ACTIVITY_EVENTS
    ? ['true', '1', 'yes'].includes(process.env.PROCESS_DEMO_ACTIVITY_EVENTS.toLowerCase())
    : "",
  'ONBOARDING_DEMO_STORY_ID': process.env.ONBOARDING_DEMO_STORY_ID ? process.env.ONBOARDING_DEMO_STORY_ID : "",
  'ONBOARDING_DEMO_WORKSPACE_ID': process.env.ONBOARDING_DEMO_WORKSPACE_ID ? process.env.ONBOARDING_DEMO_WORKSPACE_ID : "",
}