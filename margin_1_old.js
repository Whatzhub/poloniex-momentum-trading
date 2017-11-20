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
      console.log(`STATUS: ${res.statusCode}`);
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
      console.log(`STATUS: ${res.statusCode}`);
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

var wager;

var trade = new CronJob('*/10 * * * * *', function() {

  Poloniex.publicQuery(PublicAPI.returnOrderBook())
    .then(data => {

      // +enter if current volume i.e. 1 min avg > 24 hour trading volume average derived 1 min avg => by 2X

      // +short if total BTC sold > total BTC bought in past 200 trades => by 2X
      // +short if total ETH asks > total ETH bids for depth 20 => by 3X

      // +long if total BTC sold < total BTC bought in past 200 trades => by 2X
      // +long if total ETH asks < total ETH bids for depth 20 => by 3X

      // MARGIN BUY/ SELL ENTER DECISION #1
      var a = JSON.parse(data);
      var askTotal = 0;
      var bidTotal = 0;
      a.asks.forEach((el, i) => {
        askTotal += el[1];
      });
      a.bids.forEach((el, i) => {
        bidTotal += el[1];
      })
      console.log('total asks', a.asks, askTotal);
      console.log('total bids', a.bids, bidTotal);
    })
    .then(Poloniex.publicQuery(PublicAPI.returnTradeHistory())
      .then(data => {

        // MARGIN BUY/ SELL ENTER DECISION #2
        var a = JSON.parse(data);
        var sumB = 0;
        var sumS = 0;

        var b = a
          .filter(i => i.type == 'buy');
        b.forEach((el, i) => {
          sumB += +el.total;
        })
        var s = a
          .filter(i => i.type == 'sell');
        s.forEach((el, i) => {
          sumS += +el.total;
        })

        console.log('total BTC bought in past 200 trades:', sumB);
        console.log('total BTC sold in past 200 trades:', sumS);
      })
    )
    .then(setTimeout(function() {
      Poloniex.tradeQuery(TradeAPI.returnMarginAccountSummary())
        .then(data => {

          // MARGIN BUY/ SELL SIZE DECISION
          var a = JSON.parse(data);
          console.log(102, +a.totalValue);

          // Half Kelly Criterion for Bankroll Growth
          var winRate = 1; // 1 BTC win to 1 BTC lose
          var winProb = 0.55; // 5% edge
          var loseProb = 0.45;
          var Kelly = winProb - (loseProb / winRate);
          wager = +a.totalValue * (Kelly / 2); // 0.05 or 5% of bankroll
          console.log(109, wager); // 0.19 BTC for a bankroll of 3.84 BTC
        })
    }, 2000))
    .then(setTimeout(function() {
      Poloniex.tradeQuery(TradeAPI.getMarginPosition())
        .then(data => {
          // MARGIN BUY/ SELL CLOSE DECISION
          var a = JSON.parse(data);
          var trigger = wager * 0.05;
          console.log(117, +a.pl, trigger, -trigger);

          // Close Margin Trade
          if (+a.pl > trigger || +a.pl < -trigger) {
            Poloniex.tradeQuery(TradeAPI.closeMarginPosition());
          }

          // Write to CSV Closed Position Info => results, pl, date, stats, velocity, etc.

          // Cron Job End
          console.log('cron job completed...')
        })
    }, 4000))
    .catch(err => console.error('trade query error:', err));
});

trade.start();

// STATUS: 200
// HEADERS: {"date":"Mon, 20 Jun 2016 06:10:34 GMT","content-type":"application/json","transfer-encoding":"chunked","connection":"close","set-cookie":["__cfduid=dc51dd6773560df7120db976ba741c97b1466403033; expires=Tue, 20-Jun-17 06:10:33 GMT; path=/; domain=.poloniex.com; HttpOnly"],"cache-control":"private","server":"cloudflare-nginx","cf-ray":"2b5d0ef049023295-HKG"}
// BODY: {"success":1,"message":"Successfully closed margin position.","resultingTrades":{"BTC_ETH":[{"amount":"336.73366295","date":"2016-06-20 06:10:34","rate":"0.01460000","total":"4.91631147","tradeID":"11923430","type":"buy"}]}}
