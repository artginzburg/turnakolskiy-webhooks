const fs = require('fs');

function logResult(result) {
  console.log(`New log for ID ${result.ID}`);
  fs.appendFileSync(`./logs/results/${result.ID}.json`, JSON.stringify(result));
}

module.exports = logResult;
