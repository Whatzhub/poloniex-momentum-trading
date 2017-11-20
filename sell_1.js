var fs = require('fs');
var crypto = require('crypto');
var querystring = require('querystring');
var https = require('https');
var CronJob = require('cron').CronJob;
var Helpers = require('./modules/helpers');
var TradeAPI = require('./modules/trade_api');
var PublicAPI = require('./modules/public_api');

var Poloniex = {};

Poloniex.publicQuery = function(command) {
  const Host = 'poloniex.com';

  var options = {
    host: Host,
    path: '/public?command=' + command,
    port: 443,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    var req = https.request(options, (res) => {
      // console.log(`STATUS: ${res.statusCode}`);
      // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      var data = '';
      res.on('data', (chunk) => {
        // console.log(`BODY: ${chunk}`);
        data += chunk;
      });
      res.on('end', () => {
        console.log('No more data in response.')
        resolve(data);
      })
    });

    req.on('error', (e) => {
      console.log(`problem with request: ${e.message}`);
      reject(e);
    });

    // write data to request body
    req.end();
  })
}

Poloniex.tradeQuery = function(command) {
  const Key = 'Your Key';
  const Sign = 'Your Sign';
  const Host = 'poloniex.com';

  var postData = querystring.stringify(command);
  var query = crypto.createHmac('sha512', Sign).update(postData).digest('hex');
  console.log(36, query);

  var options = {
    host: Host,
    path: '/tradingApi',
    port: 443,
    method: 'POST',
    headers: {
      'Sign': query,
      'Key': Key,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  return new Promise((resolve, reject) => {
    var req = https.request(options, (res) => {
      // console.log(`STATUS: ${res.statusCode}`);
      // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      var data = '';
      res.on('data', (chunk) => {
        // console.log(`BODY: ${chunk}`);
        data += chunk;
      });
      res.on('end', () => {
        console.log('No more data in response.')
        resolve(data);
      })
    });

    req.on('error', (e) => {
      console.log(`problem with request: ${e.message}`);
      reject(e);
    });

    // write data to request body
    req.write(postData);
    req.end();
  })

};



var trade = new CronJob('*/15 * * * * *', function() {

  // Print Timestamp
  var now = new Date();
  var date = now.toString().split(' '); // Tue Apr 05 2016 16:35:46 GMT+0800 (HKT)
  var dateStamp = [date[0], date[1], date[2], date[3], date[4]].join(' '); // Tue Apr 05 2016 16:35:46

  console.log('CRON JOB STARTED -', dateStamp);

  var rawTickers;
  var tradeBalance;
  var arr1 = [];
  var arr2 = [];
  var randomPick = 0;
  var volume2hr = 0;
  var arr3 = [];
  var existingBuy = false;
  var btcBalance = 0;
  var sellArr = [];
  var existingSell = false;
  var randomSell = 0;
  var currencyName;
  var bid = 0;
  var ask = 0;

  // STEP 1 - Check all market tickers for 24-hour percentChange < -0.1
  Poloniex.publicQuery(PublicAPI.returnTicker())
    .then(data => {
      var a = JSON.parse(data);
      rawTickers = Object.assign({}, a);
      // console.log(129, a);

      for (i in a) {
        if (a[i].percentChange < -0.25) {
          sellArr.push(i);
        }
      }
      console.log('24-hour percent change & Sellable Currencies < -25%', sellArr);
      return console.log('step 1 - Check all market tickers for change < -25% ...done!' + '\n');
    })

    // STEP 2 - Get Trade Balance
    .then(_ => Poloniex.tradeQuery(TradeAPI.returnBalances()))
      .then(data => {
        var a = JSON.parse(data);
        tradeBalance = Object.assign({}, a);
        // console.log(178, tradeBalance);

        return console.log('step 2 - Get Trade Balance...done!' + '\n');
      })

    // STEP 3 - Check all 24-hour percentChange < -0.1 and if we hold that currency
    .then(_ => {
        if (sellArr.length == 0) return console.log('Nothing to Sell 1!');

        // Set random currency to sell from selling list
        var len = sellArr.length;
        var randomNum = Helpers.getRandomInt(0, len);
        randomSell = randomNum;

        // check that we hold this selling currency
        currencyName = sellArr[randomSell].split('_')[1];
        for (i in tradeBalance) {
          // console.log(214, currencyName, i, +tradeBalance[i]);
          if (currencyName == i && (+tradeBalance[i] > 0)) {
            existingSell = true;
          }
        }

        console.log('*** Currency Picked to Sell:', sellArr[randomSell]);
        return console.log('Step 3 - Check Sell currency...done!' + '\n');
      })

  // STEP 4 - If exist, check the sell entry price
  .then(_ => {
    if (sellArr.length == 0) return console.log('Nothing to Sell 2!');
    return Poloniex.publicQuery(PublicAPI.returnCustomOrderBook(sellArr[randomSell]))
  })
    .then(data => {
      if (sellArr.length == 0) return console.log('Nothing to Sell 3!');

      var a = JSON.parse(data);
      // console.log(242, a);
      ask = (a.asks[0][0] * 0.97).toFixed(8);
      // console.log(244, ask);
      return console.log('step 4 - Check the sell entry price...done!' + '\n');
    })

  // STEP 5 - Sell currency

  // * if currency amount == 0 or 1, return
  // * if 24-hour percentChange < -0.1, sell remaining % of that currency holdings (one-off)

  .then(_ => {
    if (sellArr.length == 0) return console.log('Nothing to Sell 3!');

    var bid = ask;
    var amount = +tradeBalance[currencyName];
    var btcAmt = amount * bid;

    console.log(246, bid, amount);

      if (existingSell) {
        Poloniex.tradeQuery(TradeAPI.sell(sellArr[randomSell], bid, amount))
          .then(data => console.log(203, data));
        console.log(`\t**********
         SELL MADE FOR ${sellArr[randomSell]} => TOTAL ${btcAmt} BTC
         ******** `);
      }

      console.log('Step 5 - Sell currency...done!' + '\n');
      return console.log('cron job completed');
    })

    .catch(err => console.error('trade query error:', err));
});

trade.start();
