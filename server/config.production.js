module.exports = {
  host: process.env.BASE_URL,
  acl_enabled: true,
  ToonIntegration: {
    clientId:     process.env.TOON_CLIENT_ID,
    clientSecret: process.env.TOON_CLIENT_SECRET
  },
  SSEToken: process.env.CROWNSTONE_CLOUD_SSE_TOKEN
};
