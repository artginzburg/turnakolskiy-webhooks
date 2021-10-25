const express = require('express');
const axios = require('axios');

const { requestLogger, errorLogger } = require('./middlewares/logger');
const logResult = require('./functions/logResult');

const config = {
  bitrixIncomingWebhook: 'https://b24-sp9gpy.bitrix24.ru/rest/571/j8f8intredn2w3d9/',
  rickAnalyticsEndpoint: 'https://exchange.rick.ai/transactions/tur-na-kolskiy-ru/',
};
const events = {
  ONCRMDEALADD: 'create',
  ONCRMDEALUPDATE: 'update',
  ONCRMDEALDELETE: 'delete',
};

const { PORT = 3000 } = process.env;

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

async function crmDealGet(ID) {
  try {
    const apiResponse = await axios({
      method: 'get',
      url: `${config.bitrixIncomingWebhook}crm.deal.get?ID=${ID}`,
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

  logResult(result);

  const dealData = result
    ? {
        transaction_id: result.ID,
        status: result.STAGE_ID,
        revenue: result.OPPORTUNITY ? parseFloat(result.OPPORTUNITY) : 0,
        user_id: result.CONTACT_ID,
        client_id: result.COOKIE_GA_CID, // TODO
        deal_method: result.TYPE_ID ?? result.SOURCE_ID,
      }
    : { status: 'удалена' };

  const data = {
    ...initialData,
    ...dealData,
  };

  try {
    await axios({
      method: 'post',
      url: `${config.rickAnalyticsEndpoint}${rickEventType}`,
      data,
    });
  } catch (error) {
    console.log('Rick.ai returned error:', error.response.data);
    next(error);
  }

  res.sendStatus(200);
});

app.use(errorLogger);

app.use((err, req, res, next) => {
  const { response } = err;
  console.log(err);
  res
    // .status(statusCode)
    .send({ message: response.data });
  next();
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} !`);
});

module.exports.endpoint = app;
