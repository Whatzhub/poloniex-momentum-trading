var autobahn = require('autobahn');
var fs = require('fs');
var CronJob = require('cron').CronJob;
var Helpers = require('./modules/helpers');
var writeFile = Helpers.writeFile;

var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});

var tickerData = [];
var tickerId = 0;

connection.onopen = function (session) {

	// function marketEvent (args,kwargs) {
  //   console.log('Market Events:', args, kwargs);
	// }

	function tickerEvent (args,kwargs) {
    if (args) tickerId++;
    console.log('Ticker Events:', tickerId, args[0], kwargs);

    var currencyPair = args[0];
    (currencyPair == 'BTC_ETH') ? tickerData.push([tickerId].concat(args)) : null;

    // var currencyPair = args[0].split('_')[0];
    // (currencyPair == 'BTC') ? tickerData.push([tickerId].concat(args)) : null;

    if (tickerId == 100) {
      // var header = ['tickerId', 'currencyPair', 'last', 'lowestAsk', 'highestBid', 'percentChange', 'baseVolume', 'quoteVolume', 'isFrozen', '24hrHigh', '24hrLow'];
      // var data = header + '\n' + text;
      var path = './data/tickers.csv';
      var text = tickerData.map(row => row.join(',')).join('\n');

      // data write to csv
      writeFile(path, text)
        .then(console.log('file write done'))
        .then(() => {
          // restart counters & data
          tickerData = [];
          tickerId = 0;
          })
        .catch(err => console.log('write file errors:', err));

      console.log('Writing market data for every 100 market data stream');
    }
	}

	// function trollboxEvent (args,kwargs) {
	// 	console.log('TrollBox Events:', args, kwargs);
	// }

	// session.subscribe('BTC_XMR', marketEvent);
	session.subscribe('ticker', tickerEvent);
	// session.subscribe('trollbox', trollboxEvent);
}

connection.onclose = function () {
  console.log("Websocket connection closed");

}

connection.open();
