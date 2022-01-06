const { updateDeals } = require('../../');

const {
  BITRIX_INCOMING_WEBHOOK,
  UPDATE_FROM_DATE, // e.g. '01.09.2021,23:00'
} = process.env;

if (!UPDATE_FROM_DATE) {
  console.error('UPDATE_FROM_DATE env variable is not specified — cannot update deals.');
  return;
}

console.log(`Запускается принудительное обновление сделок с ${UPDATE_FROM_DATE}`);

updateDeals({
  params: {
    bitrixIncomingWebhook: BITRIX_INCOMING_WEBHOOK,
    date: UPDATE_FROM_DATE,
  },
});
