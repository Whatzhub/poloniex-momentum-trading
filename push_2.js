var fs = require('fs');
var Helpers = require('./modules/helpers');
var Algos = require('./modules/algos');
var Traders = require('./modules/traders');

var read = Helpers.read;
var write = Helpers.writeFile;
var append = Helpers.appendFile;
var buyAlgo = Algos.buy;
var sellAlgo = Algos.sell;
var buyTrade = Traders.buy;
var sellTrade = Traders.sell;

var tickerArr = [];
var tradeArr = [];
var buyArr = [];
var sellArr = [];

// Check latest ticker updates
var tickerPath = './data/tickers.csv';
var tradePath = './data/trades.csv';

console.time('trading'),
Promise.all([
  read(tickerPath),
  read(tradePath)
])
  .then(_ => {
    tickerArr = _[0].split('\n').map(i => i.split(','));
    tradeArr = _[1].split('\n').map(i => i.split(','));
    console.log('read files done!');
  })
  // Buy Currencies
  .then(_ => buyAlgo(tickerArr))
  .then(data => buyTrade(data, tradeArr))
  .then(data => (data) ? buyArr = ('\n') + data.join('\n') : null)
  .then(_ => append(tradePath, buyArr))
  .catch(err => console.log('Buy Errors:', err))

  // Sell Currencies
  .then(_ => sellAlgo(tickerArr))
  .then(data => sellTrade(data, tradeArr))
  .then(data => (data) ? sellArr = ('\n') + data.join('\n') : null)
  .then(_ => append(tradePath, sellArr))
  .catch(err => console.log('Sell Errors:', err))

  // End
  .then(_ => console.timeEnd('trading'))
  .catch(err => console.log('Other Errors:', err));
