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

async function crmDealGet(ID) {
  try {
    const apiResponse = await axios({
      method: 'get',
      url: `https://b24-sp9gpy.bitrix24.ru/rest/571/j8f8intredn2w3d9/crm.deal.get?ID=${ID}`,
    });

    return apiResponse?.data?.result;
  } catch (error) {
    console.log(error?.data);
    return null;
  }
}

app.post('/', async (req, res) => {
  const { body } = req;

  const bitrixEventType = events[body.event];
  const dealIsNew = bitrixEventType === events.ONCRMDEALADD;

  const rickEventType = dealIsNew ? events.ONCRMDEALADD : events.ONCRMDEALUPDATE;

  const initialData = {
    transaction_id: body.data.FIELDS.ID,
    data_source: 'bitrix24',
    [`deal_${rickEventType}d_at`]: parseInt(body.ts),
  };

  const dealIsBeingDeleted = bitrixEventType === events.ONCRMDEALDELETE;
  const result = dealIsBeingDeleted ? null : await crmDealGet(body.data.FIELDS.ID);

  const dealData = result
    ? {
        transaction_id: result.ID,
        status: result.STAGE_ID,
        revenue: parseFloat(result.OPPORTUNITY),
        user_id: result.CONTACT_ID,
        client_id: result.COMPANY_ID,
        deal_method: result.TYPE_ID,
      }
    : { status: 'удалена' };

  const data = {
    ...initialData,
    ...dealData,
  };

  try {
    await axios({
      method: 'post',
      url: `https://exchange.rick.ai/transactions/tur-na-kolskiy-ru/${rickEvent}`,
      data,
    });
  } catch (error) {
    console.log(error);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Converter listening on http://localhost:${PORT} !`);
});

module.exports.endpoint = app;
