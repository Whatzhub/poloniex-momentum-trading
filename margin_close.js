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

Poloniex.tradeQuery(TradeAPI.getMarginPosition('BTC_XMR'))
    .then(data => {

      var a = JSON.parse(data);
      var marginPosition = a;
      var profitLoss = +a.pl;
      var trigger = 10;
      console.log(116, a);
      console.log(117, +profitLoss, 1.25, -trigger);

      if (+a.pl > 1.25 || +a.pl < -trigger) {
        Poloniex.tradeQuery(TradeAPI.closeMarginPosition('BTC_XMR'));
        console.log(`\t**********
             MARGIN POSITION CLOSED => MADE ${+a.pl} BTC!
             ******** `);
      }

      // TODO: Write to CSV Closed Position Info => results, pl, date, stats, velocity, etc.

      return console.log('step 5 - end');
    })
    .catch(err => console.error('trade query error:', err));
});

trade.start();
