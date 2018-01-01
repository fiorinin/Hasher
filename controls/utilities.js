module.exports = {
  isNumber: function(n) {
    return !isNaN(parseFloat(n)) && !isNaN(n - 0);
  },

  average: function(arr) {
    return arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
  },
}
