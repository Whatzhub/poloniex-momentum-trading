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



var trade = new CronJob('*/30 * * * * *', function() {

  var sumB = 0;
  var sumS = 0;
  var wager = 0;
  var d1 = 0;
  var d2 = 0;
  var d3 = 0;
  var ask = 0;
  var bid = 0;
  var profitLoss = 0;
  var marginPosition = {};

  // MARGIN BUY/ SELL ENTER DECISION #1
  Poloniex.publicQuery(PublicAPI.returnOrderBook())
    .then(data => {
      // +enter if current volume i.e. 1 min avg > 24 hour trading volume average derived 1 min avg => by 2X

      // +short if total BTC sold > total BTC bought in past 200 trades => by 2X
      // +short if total ETH asks > total ETH bids for depth 20 => by 3X

      // +long if total BTC sold < total BTC bought in past 200 trades => by 2X
      // +long if total ETH asks < total ETH bids for depth 20 => by 3X

      var a = JSON.parse(data);
      var askTotal = 0;
      var bidTotal = 0;
      ask = a.asks[0][0];
      bid = a.bids[0][0];
      console.log(127, ask, bid);

      a.asks.forEach((el, i) => {
        askTotal += el[1];
      });
      a.bids.forEach((el, i) => {
        bidTotal += el[1];
      })
      console.log('total asks', a.asks, askTotal);
      console.log('total bids', a.bids, bidTotal);

      if (askTotal > bidTotal * 3) {
        d1 = -0.5;
        console.log('D1 - sell');
      }
      if (bidTotal > askTotal * 3) {
        d1 = 0.5;
        console.log('D1 - buy');
      }
      return console.log('step 1 - end');
    })

  // MARGIN BUY/ SELL ENTER DECISION #2
  .then(_ => Poloniex.publicQuery(PublicAPI.returnTradeHistory()))
    .then(data => {

      // +short if total BTC sold > total BTC bought in past 200 trades => by 2X
      // +long if total BTC sold < total BTC bought in past 200 trades => by 2X
      var a = JSON.parse(data);

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

      if (sumS > sumB * 3) {
        d2 = -1;
        console.log('D2 - sell');
      }
      if (sumB > sumS * 3) {
        d2 = 1;
        console.log('D2 - buy');
      }
      return console.log('step 2 - end');
    })

  // MARGIN BUY/ SELL ENTER DECISION #3
  .then(_ => Poloniex.publicQuery(PublicAPI.returnChartData()))
    .then(data => {

      // +enter if current volume i.e. 1 min avg > 6 hour avg trading volume derived 1 min avg => by 3X
      var a = JSON.parse(data);
      console.log(168, a, a.length);

      var sum = 0;
      a.forEach(i => sum += i.volume);
      var avg = sum / a.length;

      console.log('avg volume/30 min:', avg, 'avg volume/min', avg / 30, 'current sell volume/min:', sumS);
      console.log('avg volume/30 min:', avg, 'avg volume/min', avg / 30, 'current buy volume/min:', sumB);

      if (sumS > ((avg / 30) * 2)) {
        d3 = -1;
        console.log('D3 - sell');
      }
      if (sumB > ((avg / 30) * 2)) {
        d3 = 1;
        console.log('D3 - buy');
      }
      return console.log('step 3 - end');
    })

  // MARGIN BUY/ SELL SIZE DECISION
  .then(_ => Poloniex.tradeQuery(TradeAPI.returnMarginAccountSummary()))
    .then(data => {

      var a = JSON.parse(data);
      console.log(102, +a.totalValue);

      // Half Kelly Criterion for Bankroll Growth
      var winRate = 1; // 1 BTC win to 1 BTC lose
      var winProb = 0.55; // 5% edge
      var loseProb = 0.45;
      var Kelly = winProb - (loseProb / winRate);
      wager = +a.totalValue * (Kelly / 2); // 0.05 or 5% of bankroll

      console.log('The Half Kelly Wager:', wager); // 0.19 BTC for a bankroll of 3.84 BTC
      return console.log('step 4 - end');
    })

  // MARGIN BUY/ SELL CLOSE DECISION
  .then(_ => Poloniex.tradeQuery(TradeAPI.getMarginPosition()))
    .then(data => {

      var a = JSON.parse(data);
      marginPosition = a;
      profitLoss = +a.pl;
      var trigger = wager * 0.035;
      console.log(117, +profitLoss, trigger, -trigger);

      if (+a.pl > trigger || +a.pl < -trigger) {
        Poloniex.tradeQuery(TradeAPI.closeMarginPosition());
        console.log(`\t**********
             MARGIN POSITION CLOSED => MADE ${+a.pl} BTC!
             ******** `);
      }

      // TODO: Write to CSV Closed Position Info => results, pl, date, stats, velocity, etc.

      return console.log('step 5 - end');
    })

  // MARGIN BUY/ SELL DECISION
  .then(_ => {
      var enter = d1 + d2 + d3; // marginBuy if +3, marginSell if -3
      var askRate = ask * 0.999;
      var bidRate = bid * 1.001;
      var amount = wager / askRate;

      console.log(`\t**********
       BUY OR SELL, ${enter}
       ******** `);

      console.log(232, askRate, bidRate, amount, +marginPosition.total, +profitLoss);

      if (enter <= -1.5 && +profitLoss == 0 && +marginPosition.total == 0) {
        Poloniex.tradeQuery(TradeAPI.marginSell(askRate, amount));
        console.log(`\t**********
         MARGIN SELL MADE FOR => ${wager} BTC
         ******** `);
      }
      if (enter >= 1.5 && +profitLoss == 0 && +marginPosition.total == 0) {
        Poloniex.tradeQuery(TradeAPI.marginBuy(bidRate, amount));
        console.log(`\t**********
         MARGIN BUY MADE FOR => ${wager} BTC
         ******** `);
      }

      console.log('step 6 - end');
      return console.log('cron job completed...')
    })
    .catch(err => console.error('trade query error:', err));
});

trade.start();

/* Trading Record

06/22/16 - Total Margin Value = 3.84648384 BTC
06/23/16 - Total Margin Value = 3.83624606 BTC
06/24/16 - Total Margin Value =
06/25/16 - Total Margin Value = 3.80280872 BTC
06/26/16 - Total Margin Value =
06/27/16 - Total Margin Value =
06/28/16 - Total Margin Value = 3.80339152 BTC

*/
