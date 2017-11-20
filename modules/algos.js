var fs = require('fs');
var Helpers = require('./helpers');

var read = Helpers.read;
var write = Helpers.writeFile;

var Algos = {};

Algos.buy = function(data) {

  // Filter out > 20 btc volume and > +10% 24 hour change
  // Sort by highest 24 hour % change,
  // Include up to top 50 currency pairs
  var filterData = data
    .filter(i => i[6] > 10 && i[5] > 0.10)
    .sort((a,b) => b[5] - a[5])
    .slice(0,50);

  // remove duplicate currency pairs
  var currencyPairs = filterData
    .map(i => i[1]);
  var uniqueArr = Array.from(new Set(currencyPairs));

  // append data back
  finalArr = [];
  var counter = 0;
  var currentPair = '';
  var arrLength = uniqueArr.length;

  uniqueArr.forEach(i => {
    filterData.forEach(j => {
      if (i == j[1] && j[1] != currentPair && counter < arrLength) {
        finalArr.push([j[0], j[1], j[2], j[3], j[4], j[5], j[6], j[7], j[8], j[9], j[10]]);
        currentPair = i;
        counter++;
      }
    })
  });

  // return data
  console.log('buy algo processed...');
  return finalArr;
}

Algos.sell = function(data) {

  // Filter out > 20 btc volume and > +10% 24 hour change
  // Sort by highest 24 hour % change,
  // Include up to top 50 currency pairs
  var filterData = data
    .filter(i => i[6] > 10 && i[5] > 0.10)
    .sort((a,b) => b[5] - a[5])
    .slice(0,50);

  // remove duplicate currency pairs
  var currencyPairs = filterData
    .map(i => i[1]);
  var uniqueArr = Array.from(new Set(currencyPairs));

  // append data back
  finalArr = [];
  var counter = 0;
  var currentPair = '';
  var arrLength = uniqueArr.length;

  uniqueArr.forEach(i => {
    filterData.forEach(j => {
      if (i == j[1] && j[1] != currentPair && counter < arrLength) {
        finalArr.push([j[0], j[1], j[2], j[3], j[4], j[5], j[6], j[7], j[8], j[9], j[10]]);
        currentPair = i;
        counter++;
      }
    })
  });

  // return data
  console.log('sell algo processed...');
  return finalArr;
}

module.exports = Algos;
