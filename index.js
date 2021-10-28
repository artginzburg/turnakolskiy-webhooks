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

function yesterday() {
  return ((d) => {
    d.setDate(d.getDate() - 1);
    return d;
  })(new Date());
}

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

async function crmDealProductrowsGet(ID) {
  try {
    const apiResponse = await axios({
      method: 'get',
      url: `${config.bitrixIncomingWebhook}crm.deal.productrows.get?ID=${ID}`,
    });

    return apiResponse?.data?.result;
  } catch (error) {
    console.log(error?.data);
    return [];
  }
}

async function crmDealList(date) {
  const fromDate = date ? new Date(date) : yesterday();
  const formattedDate = fromDate.toLocaleString('ru-RU');

  const searchParams = `filter[>DATE_MODIFY]=${formattedDate}&select[]=*&select[]=UF_*`;

  const dealListUrl = `${config.bitrixIncomingWebhook}crm.deal.list?${searchParams}`;

  try {
    const apiResponse = await axios({
      method: 'get',
      url: dealListUrl,
    });

    return apiResponse?.data?.result;
  } catch (error) {
    console.log(error?.data);
    return [];
  }
}

function dateToUNIX(dateString) {
  return new Date(dateString).getTime() / 1000;
}

async function parseResult(result) {
  return {
    transaction_id: result.ID,
    data_source: 'bitrix24',
    status: result.STAGE_ID,
    revenue: result.OPPORTUNITY ? parseFloat(result.OPPORTUNITY) : 0,
    user_id: result.CONTACT_ID,
    client_id: result.SOURCE_DESCRIPTION ?? '', // в это поле на фронтенде через Google Tag Manager записывается cookie _ga_cid
    deal_url: `https://b24-sp9gpy.bitrix24.ru/crm/deal/details/${result.ID}/`,
    deal_method: result.TYPE_ID ?? result.SOURCE_ID,
    deal_created_at: dateToUNIX(result.DATE_CREATE),
    deal_updated_at: dateToUNIX(result.DATE_MODIFY),
    grossprofit: (() => {
      const crmKeys = Object.keys(result).filter((key) => key.includes('UF_CRM_'));

      const grossprofitKeys = crmKeys.filter((crmKey) => /^[0-9]+$/.test(result[crmKey]));

      return grossprofitKeys.length ? result[grossprofitKeys[0]] : undefined;
    })(),
    items: await (async (ID) => {
      const rawItems = await crmDealProductrowsGet(ID);
      return rawItems.length
        ? rawItems.map((item) => ({
            name: item.PRODUCT_NAME,
            sku: String(item.PRODUCT_ID),
            price: String(item.PRICE),
            quantity: item.QUANTITY,
          }))
        : undefined;
    })(result.ID),
  };
}

app.get('/check/:date?', async (req, res, next) => {
  const dealList = await crmDealList(req.params.date);
  const parsedDealList = [];
  for (const deal of dealList) {
    parsedDealList.push(await parseResult(deal));
  }

  try {
    await axios({
      method: 'post',
      url: `${config.rickAnalyticsEndpoint}check`,
      data: parsedDealList,
    });
  } catch (error) {
    console.log('Rick.ai returned error:', error.response.data);
    return next(error);
  }

  res.sendStatus(200);
});

app.post('/', async (req, res, next) => {
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

  const dealData = result ? await parseResult(result) : { status: 'удалена' };

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
    return next(error);
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
