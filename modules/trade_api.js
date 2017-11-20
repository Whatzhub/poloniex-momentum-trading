var TradeAPI = {};

TradeAPI.getMarginPosition = function(currencyPair) {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'getMarginPosition',
    'currencyPair': currencyPair
  }
};

TradeAPI.buy = function(currencyPair, rate, amount) {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'buy',
    'currencyPair': currencyPair,
    'rate': rate,
    'amount': amount
  }
};

TradeAPI.sell = function(currencyPair, rate, amount) {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'sell',
    'currencyPair': currencyPair,
    'rate': rate,
    'amount': amount
  }
};

TradeAPI.marginBuy = function(rate, amount) {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'marginBuy',
    'currencyPair': 'BTC_ETH',
    'rate': rate,
    'amount': amount
  }
};

TradeAPI.marginSell = function(rate, amount) {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'marginSell',
    'currencyPair': 'BTC_ETH',
    'rate': rate,
    'amount': amount
  }
};

TradeAPI.closeMarginPosition = function(currencyPair) {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'closeMarginPosition',
    'currencyPair': currencyPair
  }
};

TradeAPI.returnMarginAccountSummary = function() {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'returnMarginAccountSummary'
  }
}

TradeAPI.returnTradableBalances = function() {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'returnTradableBalances'
  }
}

TradeAPI.returnBalances = function() {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'returnBalances'
  }
}

TradeAPI.returnOpenOrders = function(currencyPair) {
  var nonce = null;
  nonce = new Date().getTime() * 1000;
  return {
    'nonce': nonce,
    'command': 'returnOpenOrders',
    'currencyPair': currencyPair
  }
}

module.exports = TradeAPI;
