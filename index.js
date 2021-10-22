const express = require('express');
const axios = require('axios');

const { PORT = 3000 } = process.env;

const app = express();

app.use(express.urlencoded({ extended: true }));

axios({
  method: 'get',
  url: 'https://b24-sp9gpy.bitrix24.ru/rest/571/j8f8intredn2w3d9/crm.deal.get?ID=279',
}).then((result) => {
  console.log(result.data);
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
