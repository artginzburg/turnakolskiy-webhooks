const express = require('express');
const axios = require('axios');

const { PORT = 3000 } = process.env;

const app = express();

app.use(express.urlencoded({ extended: true }));

axios({
  method: 'get',
  url: 'https://b24-sp9gpy.bitrix24.ru/rest/crm.deal.get?auth=8ng5pm4ym2r3hy4rapplypfhx7r99ze9&ID=275',
  // auth: {
  //   domain: 'b24-sp9gpy.bitrix24.ru',
  //   client_endpoint: 'https://b24-sp9gpy.bitrix24.ru/rest/',
  //   server_endpoint: 'https://oauth.bitrix.info/rest/',
  //   member_id: 'f48783b2455adff9acdc00f3e6b2d78f',
  //   application_token: '8ng5pm4ym2r3hy4rapplypfhx7r99ze9',
  // },
  data: {
    // id: 275,
    // auth: {
    //   // domain: 'b24-sp9gpy.bitrix24.ru',
    //   // client_endpoint: 'https://b24-sp9gpy.bitrix24.ru/rest/',
    //   // server_endpoint: 'https://oauth.bitrix.info/rest/',
    //   // member_id: 'f48783b2455adff9acdc00f3e6b2d78f',
    //   application_token: '8ng5pm4ym2r3hy4rapplypfhx7r99ze9',
    // },
    auth: '8ng5pm4ym2r3hy4rapplypfhx7r99ze9',
  },
}).then((result) => {
  console.log(result);
});

app.post('/', async (req, res) => {
  const { body } = req;

  console.log(body);

  res.sendStatus(200);

  // try {
  //   if (!body || !Object.keys(body).length) {
  //     return res.sendStatus(400);
  //   }

  //   await axios({
  //     method: 'post',
  //     url: req.params.url,
  //     data: body,
  //   });
  //   res.sendStatus(200);
  // } catch (error) {
  //   console.log(error);
  //   res.sendStatus(500);
  // }
});

app.listen(PORT, () => {
  console.log(`Converter listening on http://localhost:${PORT} !`);
});

module.exports.endpoint = app;
