// DATA STRUCTURES AS FOLLOWS

// ['tickerId', 'currencyPair', 'last', 'lowestAsk', 'highestBid', 'percentChange', 'baseVolume', 'quoteVolume', 'isFrozen', '24hrHigh', '24hrLow', 'place buy', 'not sold', 'buyPrice', 'buyAmt', 'dateStamp', 'timeStamp'];

var Traders = {};

Traders.buy = function(tickerData, tradeData) {

  // Setup Timestamp
  var now = new Date();
  var timeStamp = now.getTime(); // Unix timestamp
  var date = now.toString().split(' '); // Tue Apr 05 2016 16:35:46 GMT+0800 (HKT)
  var dateStamp = [date[0], date[1], date[2], date[3], date[4]].join(' '); // Tue Apr 05 2016 16:35:46

  // Check Existing trades
  var newTrades = [];
  var existingTrades = [];

  tickerData.forEach(i => {
    tradeData.forEach(j => {
      // console.log(timeStamp - j[16], 19);
      if (i[8] == 0 && j[16] == undefined) {
        var buyPrice = i[2] * 1.01;
        var buyAmt = i[6] * 0.01;
        var pB = 'place buy';
        var s = 'not sold';

        newTrades.push([i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], pB, s, buyPrice, buyAmt, dateStamp, timeStamp]);
      }

      if (i[8] == 0 && j[16] !== undefined && j[16] > 86400) {
        existingTrades.push([j[1], j[2], j[3], j[4], j[5], j[6], j[7], j[8], j[9], j[10], j[11], j[12], j[13], j[14], j[15], j[16]].concat([buyPrice]));
      }
    })
  });

  console.log(newTrades, 37);
  console.log(existingTrades, 38);

  // Setup Public API history trades & order book depths




  // Trade for non-frozen currency pairs only
  // Buy Price set at Last Traded Price
  // Buy Amount set at 1% of 24 hour BTC trading volume
  var buyOrders = proceedTrades.map(i => {
    var buyPrice = i[2];
    var buyAmt = i[6] * 0.01;
    var pB = 'place buy';
    var s = 'not sold';

    var buy = [i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], pB, s, buyPrice, buyAmt, dateStamp, timeStamp];
    return buy;
  })

  // Mock Buy Order
  console.log('currency bought');
  return buyOrders;


  // setup Trading API Buy



}


Traders.sell = function(tickerData, tradeData) {

  // Setup Timestamp
  var now = new Date();
  var timeStamp = now.getTime(); // Unix timestamp
  var date = now.toString().split(' '); // Tue Apr 05 2016 16:35:46 GMT+0800 (HKT)
  var dateStamp = [date[0], date[1], date[2], date[3], date[4]].join(' '); // Tue Apr 05 2016 16:35:46

  // Check Existing trades
  var skipTrade = false;
  tickerData.map(i => {
    if (i[8] == 1 && timeStamp - i[16] < 86400 || i[16] == undefined) {
      return skipTrade = true;
    }
  });

  if (skipTrade) return;

  // Setup Public API history trades & order book depths



  // Trade for non-frozen currency pairs only
  // Buy Price set at Last Traded Price
  // Buy Amount set at 1% of 24 hour BTC trading volume
  var sellOrders = tickerData.map(i => {
    if (i[8] == 1) return;
    var sellPrice = i[2];
    var sellAmt = i[6] * 0.01;
    var pS = 'place sell';
    var s = 'sold';

    var sell = [i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], pS, s, sellPrice, sellAmt, dateStamp, timeStamp];
    return sell;
  })

  // Mock Sell Order

  console.log('currency sold');
  return sellOrders;

  // setup Trading API Sell


}

module.exports = Traders;
