require('axios')({
  url: `https://artginzburg.runkit.io/turnakolskiy-webhooks/branches/master/${process.env.BITRIX_INCOMING_WEBHOOK}/check`,
});
