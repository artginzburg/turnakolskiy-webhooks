const express = require('express');
const axios = require('axios');

const { PORT = 3000 } = process.env;

const app = express();

app.use(express.urlencoded({ extended: true }));

const events = {
  ONCRMDEALADD: 'create',
  ONCRMDEALUPDATE: 'update',
  ONCRMDEALDELETE: 'delete',
};

app.post('/', async (req, res) => {
  const { body } = req;

  console.log(body);

  const eventType = events[body.event];
  const dealIsNew = eventType === 'create';

  if (dealIsNew || eventType === 'update') {
    const apiResponse = await axios({
      method: 'get',
      url: `https://b24-sp9gpy.bitrix24.ru/rest/571/j8f8intredn2w3d9/crm.deal.get?ID=${body.data.FIELDS.ID}`,
    });

    const { result } = apiResponse.data;

    await axios({
      method: 'post',
      url: `https://exchange.rick.ai/transactions/tur-na-kolskiy-ru/${eventType}`,
      data: {
        transaction_id: result.ID,
        status: result.STAGE_ID,
        revenue: parseFloat(result.OPPORTUNITY),
        user_id: result.CONTACT_ID,
        client_id: result.COMPANY_ID,
        deal_method: result.TYPE_ID,
        data_source: 'bitrix24',
        [`deal_${dealIsNew ? 'created' : 'updated'}_at`]: parseInt(body.ts),
      },
    });

    return res.sendStatus(200);
  }

  if (eventType === 'delete') {
    await axios({
      method: 'post',
      url: `https://exchange.rick.ai/transactions/tur-na-kolskiy-ru/${'update'}`,
      data: {
        transaction_id: body.data.FIELDS.ID,
        status: 'удалена',
        // revenue: parseFloat(result.OPPORTUNITY),
        // user_id: result.CONTACT_ID,
        // client_id: result.COMPANY_ID,
        // deal_method: result.TYPE_ID,
        data_source: 'bitrix24',
        [`deal_${dealIsNew ? 'created' : 'updated'}_at`]: parseInt(body.ts),
      },
    });

    res.sendStatus(200);
    return;
  }
});

app.listen(PORT, () => {
  console.log(`Converter listening on http://localhost:${PORT} !`);
});

module.exports.endpoint = app;
