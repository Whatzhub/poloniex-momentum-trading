var PublicAPI = {};

PublicAPI.returnTicker = function() {
  return 'returnTicker';
};

PublicAPI.return24hVolume = function() {
  return 'return24hVolume';
}

PublicAPI.returnOrderBook = function() {
  return 'returnOrderBook&currencyPair=BTC_ETH&depth=20';
};

PublicAPI.returnCustomOrderBook = function(currencyPair) {
  return 'returnOrderBook&currencyPair=' + currencyPair + '&depth=20';
};

PublicAPI.returnTradeHistory = function() {
  return 'returnTradeHistory&currencyPair=BTC_ETH';
};

PublicAPI.returnChartData = function() {
  var timestamp = Math.round(+new Date() / 1000) - 21600; // 6 hours ago
  return 'returnChartData&currencyPair=BTC_ETH&start='+timestamp+'&end=9999999999&period=1800';
};

PublicAPI.returnCustomChartData = function(currencyPair, period) {
  var timestamp = Math.round(+new Date() / 1000) - period; // custom period - 1800 = 30 mins, 21600 = 6 hours
  return 'returnChartData&currencyPair=' + currencyPair + '&start='+timestamp+'&end=9999999999&period=' + period;
};

module.exports = PublicAPI;
