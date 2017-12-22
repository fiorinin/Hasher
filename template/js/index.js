const {ipcRenderer} = require('electron');
const Store = require('electron-store');
const store = new Store();

$("#version").text("Hasher v"+store.get("version"))
$(".menu").click(function() {
  ipcRenderer.send('changePage', $(this).attr('id'))
})

let pref_cur = store.get("pref_cur");
if (pref_cur === undefined) {
  pref_cur = "usd";
  store.set("pref_cur", pref_cur);
}
if (pref_cur == "usd") {
  $("#curusd").prop("checked", true);
} else {
  $("#cureur").prop("checked", true);
}

updateCurrency();

$("#curusd").change(function() {
  store.set("pref_cur", "usd");
  updateCurrency();
})

$("#cureur").change(function() {
  store.set("pref_cur", "eur");
  updateCurrency();
})

// Fetch BTC value
function updateCurrency() {
  var url = 'https://api.coindesk.com/v1/bpi/currentprice.json';
  var https = require('https');
  https.get(url, function(res) {
      var body = '';

      res.on('data', function(chunk){
          body += chunk;
      });

      res.on('end', function(){
          var response= JSON.parse(body);
          store.set("btcusd", Math.round(response.bpi.USD.rate_float));
          store.set("btceur", Math.round(response.bpi.EUR.rate_float));
          $("#btcusd").text("1BTC = "+store.get("btcusd")+"USD");
          $("#btceur").text("1BTC = "+store.get("btceur")+"EUR");
          updateBTC();
      });
  })
}

function updateBTC() {
  $("#balance_btc").html(store.get("balance")+" <small id='balance_val'><spanclass='curr'>BTC</span></small>");
  if(store.get("pref_cur") == "usd") {
    $("#balance_cur").html(store.get("balance")*store.get("btcusd")+" <small id='balance_val'><spanclass='curr'>USD</span></small>");
  } else {
    $("#balance_cur").html(store.get("balance")*store.get("btceur")+" <small id='balance_val'><spanclass='curr'>EUR</span></small>");
  }
}
