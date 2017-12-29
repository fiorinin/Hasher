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
var estimate = store.get("estimate");
var miners = config.miners;
var mining = {};
var cmd;
var donate_cmd;
var intervalID;

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

$(".glyphicon-exclamation-sign").hide()
$('[data-toggle="tooltip"]').tooltip();
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

function updateBTC(est) {
  var cur = store.get("pref_cur");
  var val = store.get(`btc${cur}`);
  bal = store.get("balance");
  $("#balance_btc").html(`<small id='balance_val'>${bal} <spanclass='curr'>BTC</span></small>`);
  $("#balance_cur").html(`<small id='balance_val'>${bal*val} <spanclass='curr'>${cur.toUpperCase()}</span></small>`);
  if(Object.keys(mining).length != 0) {
    if(est == null)
      est = parseFloat($("#est_btc").text());
    if(!Number.isNaN(est)) {
      var est_cur = est * val;
      $("#est_btc").html(`<small>${est}<span id='estbtc'> BTC</span></small>`);
      $("#est_cur").html(`<small>${est_cur}<span id='estcur'> ${cur.toUpperCase()}</span></small>`);
    }
  }
}

function checkProfit(callback) {
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
          var hr = store.get("benched")[concat] // algo-miner bench
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
            instructions.profit = profit;
          }
        }
      }
    }
    // Get miner from alias
    var miner;
    for(idx in miners) { if(miners[idx].alias == instructions.alias) {miner = miners[idx]; }}
    callback(instructions, miner);
  });
}

// Hash hash hash
var average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
$("#hash").click(function() {
  if(Object.keys(mining).length == 0) {
    checkProfit(function(instructions, miner) {
      // If we got a max profit algo
      if(instructions !== undefined) {
        cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, instructions.algo, intensities[`${instructions.algo}-${instructions.alias}`], instructions["stratum"], gpus_to_use, false);
        donate_cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, instructions.algo, intensities[`${instructions.algo}-${instructions.alias}`], instructions["stratum"], gpus_to_use, true);
        startMining(instructions, false);
      }
    })
  } else {
    mining.process.kill();
    mining = {};
  }
});

function startMining(instructions, donate){
  console.log("start animate")
  $("#hash").addClass("text animated pulse infinite")
            .html(`&nbsp;Hashing...<br><small class="miningStats">${instructions.algo}<br><span class="hr"></span></small></button`);
  var checkInterval = 30000; // 600000
  var run = cmd;
  if(donate) {
    checkInterval = 60000;
    run = donate_cmd;
    $("#whatsitdoing").text("♥ Donating ♥");
  } else {
    $("#whatsitdoing").text("Estimated daily");
  }
  console.log(run)
  var m = spawn(...run);
  var HRqueue = [];
  var avgHR = 0;
  mining.process = m;
  if(mining.start === undefined)
    mining.start = Date.now();
  mining.cmd = run;
  m.stdout.on('data', (data) => {
    hash = mutils.getHashrate(cmd[0], new TextDecoder("utf-8").decode(data));
    if (config.debug == true) {
      console.log(hash);
    }
    if(isNumber(hash)) {
      if(HRqueue.length == 5) {
        HRqueue.shift();
      }
      HRqueue.push(hash);
      avgHR = average(HRqueue);
      $(".hr").text(mutils.pprint(avgHR));

      if(!donate) {
        // Estimate profit
        var pid = instructions["pid"];
        var pool = config.pools[pid];
        var coin_unit = pool.coin_unit.default;
        if (pool.coin_unit[instructions.algo] !== undefined) {
          coin_unit = pool.coin_unit[instructions.algo];
        }

        var btc = avgHR / coin_unit * instructions[estimate] * pool.profit_multiplier
        var est_btc = Math.round(btc * config.decimals.btc) / config.decimals.btc;
        updateBTC(est_btc);
      }
    }
  });

  m.stderr.on('data', (data) => {
    err = new TextDecoder("utf-8").decode(data);
    if (config.debug == true) {
      console.log(`Error: ${err}`);
    }
  });

  // When job is closed
  m.on('close', (code) => {
    window.clearInterval(intervalID);
    console.log("stop animate")
    $("#hash").removeClass("text animated pulse infinite")
              .html("Hash!");
    $("#est_btc").html(``);
    $("#est_cur").html(``);
  });

  // Update BTC price and balances every 10mins
  intervalID = setInterval(function () {
    // Update sum of balances and BTC values
    var now = Date.now();
    if(!donate) {
      refreshBalance();
      checkProfit(function(new_instructions, miner) {
        var sw = false;
        // Does it suggest a different algo/pool?
        if(new_instructions !== undefined && (new_instructions.algo != instructions.algo || new_instructions["pid"] != instructions["pid"]))
          sw = true;
        // If we decide to switch algos
        if(sw) {
          cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, new_instructions.algo, intensities[`${new_instructions.algo}-${new_instructions.alias}`], instructions["stratum"], gpus_to_use, false);
          donate_cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, new_instructions.algo, intensities[`${new_instructions.algo}-${new_instructions.alias}`], instructions["stratum"], gpus_to_use, true);
          mining.process.kill();
          setTimeout(function(){ startMining(new_instructions, false); }, 5000); // Kiil needs times...
        }
        else if(store.get("donation") > 0 && now - mining.start > 86400000) {
          mining.process.kill();
          mining = {};
          setTimeout(function(){ startMining(instructions, true); }, 5000); // Kiil needs times...
        }
      });
    } else {
      // Donated enough
      if(now - mining.start > percentsToMilliseconds(store.get("donation"))) {
        mining.process.kill();
        mining = {};
        setTimeout(function(){ startMining(instructions, false); }, 5000); // Kiil needs times...
      }
    }
  }, checkInterval);
}

function percentsToMilliseconds(p) {
  return Math.round(((p*86400000) * 100) / 100);
}

function refreshBalance() {
  mutils.getSumPoolBalances(function(err, sum){
    if(err != null) {
      $(".glyphicon-exclamation-sign").show();
    } else {
      $(".glyphicon-exclamation-sign").hide();
    }
    store.set("balance", sum);
    updateCurrency();
  });
}
refreshBalance();

// Go to introduction if first time
if(store.get("intro") == false) {
  ipcRenderer.send('changePage', "intro");
}
