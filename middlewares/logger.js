const winston = require('winston');
const expressWinston = require('express-winston');

const dirname = 'logs';
const format = winston.format.json();

const requestLogger = expressWinston.logger({
  transports: [new winston.transports.File({ dirname, filename: 'request.log' })],
  format,
});

const errorLogger = expressWinston.errorLogger({
  transports: [new winston.transports.File({ dirname, filename: 'error.log' })],
  format,
});

module.exports = {
  requestLogger,
  errorLogger,
};
