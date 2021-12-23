const axios = require('axios');
const express = require('express');

const { logResult, yesterday, dateToUNIX } = require('./functions');

const { PORT = 3000, NODE_ENV } = process.env;

const isEnvDevelopment = NODE_ENV === 'development';

const { requestLogger, errorLogger } = isEnvDevelopment ? require('./middlewares/logger') : {};

const config = {
  rickAnalyticsEndpoint: 'https://exchange.rick.ai/transactions/tur-na-kolskiy-ru/',
};

const crm = {
  events: {
    ONCRMDEALADD: 'create',
    ONCRMDEALUPDATE: 'update',
    ONCRMDEALDELETE: 'delete',
  },
  deal: {
    async get(req, ID) {
      try {
        const apiResponse = await axios({
          url: `${req.params.bitrixIncomingWebhook}crm.deal.get?ID=${ID}`,
        });

        return apiResponse?.data?.result;
      } catch (error) {
        console.log(error?.data);
        return null;
      }
    },
    async list(req, date) {
      const fromDate = date ? new Date(date) : yesterday();
      const formattedDate = fromDate.toLocaleString('ru-RU');

      const searchParams = `filter[>DATE_MODIFY]=${formattedDate}&select[]=*&select[]=UF_*`;

      const dealListUrl = `${req.params.bitrixIncomingWebhook}crm.deal.list?${searchParams}`;

      try {
        const apiResponse = await axios({
          url: dealListUrl,
        });

        return apiResponse?.data?.result;
      } catch (error) {
        console.log(error?.data);
        return [];
      }
    },
    productrows: {
      async get(req, ID) {
        try {
          const apiResponse = await axios({
            url: `${req.params.bitrixIncomingWebhook}crm.deal.productrows.get?ID=${ID}`,
          });

          return apiResponse?.data?.result;
        } catch (error) {
          console.log(error?.data);
          return [];
        }
      },
    },
  },
};

async function parseResult(req, result) {
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
      const userFields = Object.keys(result).filter((key) => key.includes('UF_CRM_'));
      const grossprofitKeys = userFields.filter((crmKey) => /^[0-9]+$/.test(result[crmKey]));
      return grossprofitKeys.length ? result[grossprofitKeys[0]] : undefined;
    })(),
    items: await (async (ID) => {
      const rawItems = await crm.deal.productrows.get(req, ID);
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

const app = express();

app.param('bitrixIncomingWebhook', function(req, res, next, bitrixIncomingWebhook) {
  req.bitrixIncomingWebhook = decodeURIComponent(bitrixIncomingWebhook);
  next();
});

if (isEnvDevelopment) {
  app.use(requestLogger);
}

app.use(express.urlencoded({ extended: true }));

app.get('/:bitrixIncomingWebhook/check/:date?', async (req, res, next) => {
  const dealList = await crm.deal.list(req, req.params.date);
  const parsedDealList = [];
  for (const deal of dealList) {
    parsedDealList.push(await parseResult(req, deal));
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

app.post('/:bitrixIncomingWebhook', async (req, res, next) => {
  const { body } = req;

  const bitrixEventType = crm.events[body.event];
  const dealIsNew = bitrixEventType === crm.events.ONCRMDEALADD;

  const rickEventType = dealIsNew ? crm.events.ONCRMDEALADD : crm.events.ONCRMDEALUPDATE;

  const initialData = {
    transaction_id: body.data.FIELDS.ID,
    data_source: 'bitrix24',
    [`deal_${rickEventType}d_at`]: parseInt(body.ts),
  };

  const dealIsBeingDeleted = bitrixEventType === crm.events.ONCRMDEALDELETE;
  const result = dealIsBeingDeleted ? null : await crm.deal.get(req, body.data.FIELDS.ID);

  if (isEnvDevelopment) {
    logResult(result);
  }

  const dealData = result ? await parseResult(req, result) : { status: 'удалена' };

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

if (isEnvDevelopment) {
  app.use(errorLogger);
}

app.use((err, req, res, next) => {
  const { response } = err;
  console.log(err);
  res
    // .status(statusCode)
    .send({ message: response.data });
  next();
});

if (isEnvDevelopment) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT} !`);
  });
}

module.exports.endpoint = app;
