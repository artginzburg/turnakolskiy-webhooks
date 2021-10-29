require('axios')({
  url: `https://artginzburg.runkit.io/turnakolsky-webhooks/branches/master/${process.env.BITRIX_INCOMING_WEBHOOK}/check`,
});
