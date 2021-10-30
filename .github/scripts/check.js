require('axios')({
  url: `https://artginzburg.runkit.io/turnakolskiy-api/branches/master/${process.env.BITRIX_INCOMING_WEBHOOK}/check`,
});
