const {ipcRenderer} = require('electron');
const Store = require('electron-store');
const store = new Store();
var https = require('https');
const MiningUtils = require("../../controls/miningutils.js");
const mutils = new MiningUtils();
var spawn = require('child_process').spawn;
const remote = require('electron').remote;
const app = remote.app;
const binPath = app.getPath('userData') +"/bin/";

var config = store.get("config");
var enabled_algos = store.get("enabled_algos");
var benched = store.get("benched");
var gpus_to_use = store.get("gpus_to_use");
var intensities = store.get("intensities");
var miners = config.miners;
var mining = {};

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

// Hash hash hash
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
$("#hash").click(function() {
  if(Object.keys(mining).length == 0) {
    var estimate = store.get("estimate");
    mutils.getMaxProfit(function(max_profit) {
      var instructions;
      for(var concat in enabled_algos) {
        var sp = concat.split("-");
        var algo = sp[0];
        var miner_alias = sp[1];
        if(enabled_algos[concat]) {
          // We need a stratum
          var mp = max_profit[algo]
          if (mp !== undefined) {
            // Calculate profit
            var hr = benched[concat] // algo-miner bench
            var pid = mp["pid"];
            var pool = config.pools[pid];
            var coin_unit = pool.coin_unit.default;
            if (pool.coin_unit[algo] !== undefined) {
              coin_unit = pool.coin_unit[algo];
            }
            profit = hr / coin_unit * mp[estimate] * pool.profit_multiplier;
            if(instructions === undefined || profit > instructions.profit) {
              instructions = mp;
              instructions.alias = miner_alias;
              instructions.algo = algo;
            }
          }
        }
      }
      // If we got a max profit algo
      if(instructions !== undefined) {
        // Get miner from alias
        var miner;
        for(idx in miners) { if(miners[idx].alias == instructions.alias) {miner = miners[idx]; }}
        var cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, instructions.algo, intensities[`${instructions.algo}-${instructions.alias}`], instructions["stratum"], gpus_to_use);

        $("#hash").addClass("text animated pulse infinite")
                  .text("Hashing...");
        var m = spawn(...cmd);
        mining.process = m;
        m.stdout.on('data', (data) => {
          hash = mutils.getHashrate(cmd[0], new TextDecoder("utf-8").decode(data));
          if (config.debug == true) {
            console.log(hash);
          }
        });

        m.stderr.on('data', (data) => {
          err = new TextDecoder("utf-8").decode(data);
          if (config.debug == true) {
            console.log(err);
          }
        });

        // When job is closed
        m.on('close', (code) => {

        });

        // Update UI every now and then...
        // var x = 0;
        // var intervalID = setInterval(function () {
        //   barval += increment/barRefreshFraction;
        //   bar.animate(barval);
        //    if (++x === barRefreshFraction) {
        //        window.clearInterval(intervalID);
        //        m.kill();
        //    }
        // }, benchtime/barRefreshFraction);
      }
    });
  } else {
    $("#hash").removeClass("text animated pulse infinite")
              .text("Hash!")
    mining.process.kill();
    mining = {};
  }
});

// Go to introduction if first time
if(store.get("intro") == false) {
  ipcRenderer.send('changePage', "intro");
}
