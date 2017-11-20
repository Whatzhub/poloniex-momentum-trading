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

  // STEP 1 - Check all market tickers for 24-hour percentChange > 0.1 and < 0.25
  Poloniex.publicQuery(PublicAPI.returnTicker())
    .then(data => {
      var a = JSON.parse(data);
      rawTickers = Object.assign({}, a);
      // console.log(129, a);

      for (i in a) {
        if (a[i].percentChange > 0.1 && a[i].percentChange < 0.25) {
          arr1.push(i);
        }
      }
      console.log('24-hour percent change > +10% and < +25%', arr1);
      return console.log('step 1 - Check all market tickers for change > +10% and < +25%...done!' + '\n');
    })

  // STEP 2 - Check the 24-hour volume > 10 BTC
  .then(_ => Poloniex.publicQuery(PublicAPI.return24hVolume()))
    .then(data => {
      var a = JSON.parse(data);
      for (i in a) {
        arr1.forEach(j => {
          if (i == j && a[i].BTC > 10) {
            arr2.push(i);
          }
        });
      }
      var len = arr2.length;
      var randomNum = Helpers.getRandomInt(0, len);
      randomPick = arr2[randomNum];
      (randomPick) ? randomPick : randomPick = 'BTC_ETH';

      console.log('24-hour volume > 10 BTC and > +10%', arr2);
      console.log('*** Currency Picked To Buy:', randomPick);
      return console.log('step 2 - Check the 24-hour volume > 10 BTC...done!' + '\n');
    })

  // STEP 3 - Check whether percentChange > 0.04, volume > 4 BTC happened in past 2 hours (i.e. 7200 secs)
  .then(_ => Poloniex.publicQuery(PublicAPI.returnCustomChartData(randomPick, 7200)))
    .then(data => {
      var a = JSON.parse(data);
      // console.log(167, a);
      var b = (a[0].high - a[0].open) / a[0].open;
      var c = +a[0].volume;

      var i = arr2.indexOf(randomPick);
      if ((b > 0.04) && (c > 4)) {
        arr3.push(arr2[i]);
      }
      volume2hr = +a[0].volume;
      console.log(156, b, arr3);
      console.log('2 hour volume:', volume2hr);
      return console.log('step 3 - Check +4% percentChange with +4 BTC volume happened over past 2 hours...done!' + '\n');
    })

  // STEP 4 - Check if bought already
  .then(_ => Poloniex.tradeQuery(TradeAPI.returnBalances()))
    .then(data => {
      var a = JSON.parse(data);
      tradeBalance = Object.assign({}, a);
      // console.log(178, tradeBalance);

      if (arr3.length > 0) {
        var b = arr3[0].split('_')[1];

        for (i in a) {
          if (+a[b] > 0) {
            existingBuy = true;
          }
          if (i == 'BTC') {
            btcBalance = +a[i];
          }
        }
      }
      console.log(180, existingBuy);
      console.log('BTC Balance:', btcBalance);
      return console.log('step 4 - Check if bought already...done!' + '\n');
    })

  // STEP 5 - If not exist, check the buy entry price
  .then(_ => {
    if (arr3.length == 0) return console.log('Nothing to Buy 1!');
    return Poloniex.publicQuery(PublicAPI.returnCustomOrderBook(arr3[0]))
  })
    .then(data => {
      if (arr3.length == 0) return console.log('Nothing to Buy 2!');

      var a = JSON.parse(data);
      bid = (a.bids[0][0] * 1.02).toFixed(8);
      console.log(202, bid);
      return console.log('step 5 - Check the buy entry price...done!' + '\n');
    })

  // STEP 5.5 - TODO: Check whether any open orders to avoid duplicate buy orders


  // STEP 6 - Buy currency
  .then(_ => {
      if (arr3.length == 0) return console.log('Nothing to Buy 3!');

      var btcLimit = btcBalance * 0.05;
      var volLimit = volume2hr * 0.05;
      var wager = Math.min(btcLimit, volLimit);
      var amount = wager / bid;

      console.log(217, wager, amount);

      if (!existingBuy) {
        Poloniex.tradeQuery(TradeAPI.buy(arr3[0], bid, amount));
        console.log(`\t**********
         BUY MADE FOR ${arr3[0]} => TOTAL ${wager} BTC
         ******** `);
      }

      return console.log('Step 6 - Buy currency...done!' + '\n');
    })

    // STEP 7 - Check all 24-hour percentChange >= 0.3 and if we hold that currency

    .then(_ => {
        // Currencies that > 0.3 percentChange and that we hold
        for (i in rawTickers) {
          if (rawTickers[i].percentChange > 0.3) {
            sellArr.push(i);
          }
        }
        console.log('Sellable Currencies:', sellArr);

        if (sellArr.length == 0) return console.log('Nothing to Sell 0!');

        // Set random currency to sell from selling list
        var len = sellArr.length;
        var randomNum = Helpers.getRandomInt(0, len);
        randomSell = randomNum;

        // check that we hold this selling currency
        currencyName = sellArr[randomSell].split('_')[1];
        for (i in tradeBalance) {
          // console.log(214, currencyName, i, +tradeBalance[i]);
          if (currencyName == i && (+tradeBalance[i] > 1)) {
            existingSell = true;
          }
        }

        console.log('*** Currency Picked to Sell:', sellArr[randomSell]);
        return console.log('Step 7 - Check Sell currency...done!' + '\n');
      })

  // STEP 8 - If exist, check the sell entry price
  .then(_ => {
    if (sellArr.length == 0) return console.log('Nothing to Sell 1!');
    return Poloniex.publicQuery(PublicAPI.returnCustomOrderBook(sellArr[randomSell]))
  })
    .then(data => {
      if (sellArr.length == 0) return console.log('Nothing to Sell 2!');

      var a = JSON.parse(data);
      // console.log(242, a);
      ask = (a.asks[0][0] * 1.03).toFixed(8);
      // console.log(244, ask);
      return console.log('step 8 - Check the sell entry price...done!' + '\n');
    })

  // STEP 9 - Sell currency

  // * if 24-hour percentChange >= 0.3, sell 50% of that currency holdings (continuously)
  // * if 24-hour precentChange >= 0.75, sell all - 1 amount of that currency holdings
  // * if currency amount == 0 or 1, return
  // * TODO: if 24-hour percentChange <= -0.1, sell remaining % of that currency holdings (one-off)

  .then(_ => {
    if (sellArr.length == 0) return console.log('Nothing to Sell 3!');

    var bid = ask;
    var sellBalance = +tradeBalance[currencyName];
    var amount = sellBalance * 0.5;
    var btcAmt = amount * bid;

    if (sellBalance == 0) return console.log('Nothing to Sell 4!');
    console.log(246, bid, amount);

      if (existingSell && (sellBalance > 1) && (btcAmt > 0.0002)) {
        Poloniex.tradeQuery(TradeAPI.sell(sellArr[randomSell], bid, amount));
        console.log(`\t**********
         SELL MADE FOR ${sellArr[randomSell]} => TOTAL ${btcAmt} BTC
         ******** `);
      }
      else console.log('Amount too small to sell!');

      console.log('Step 9 - Sell currency...done!' + '\n');

      return console.log('cron job completed');
    })

    .catch(err => console.error('trade query error:', err));
});

trade.start();
