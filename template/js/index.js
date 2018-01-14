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
const log = require('electron-log');

var config = store.get("config");
var enabled_algos = store.get("enabled_algos");
var benched = store.get("benched");
var gpus_to_use = store.get("gpus_to_use");
var intensities = store.get("intensities");
var estimate = store.get("estimate");
var profitCheckFreq = store.get("profitCheckFreq");
var smoothing = store.get("smoothing");
var miners = config.miners;
var mining = {};
var cmd;
var donate_cmd;
var intervalID;
var relaunch = {};

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
  bal = Math.round(store.get("balance") * config.decimals.btc) / config.decimals.btc;
  var bal_cur = Math.round(bal * val * config.decimals.cur) / config.decimals.cur;
  $("#balance_btc").html(`<small id='balance_val'>${bal} <spanclass='curr'>BTC</span></small>`);
  $("#balance_cur").html(`<small id='balance_val'>${bal_cur} <spanclass='curr'>${cur.toUpperCase()}</span></small>`);
  if(Object.keys(mining).length != 0) {
    if(est == null)
      est = parseFloat($("#est_btc").text());
    if(!Number.isNaN(est)) {
      var est_cur = Math.round(est * val * config.decimals.cur) / config.decimals.cur;
      var est = Math.round(est * config.decimals.btc) / config.decimals.btc;
      $("#est_btc").html(`<small>${est}<span id='estbtc'> BTC</span></small>`);
      $("#est_cur").html(`<small>${est_cur}<span id='estcur'> ${cur.toUpperCase()}</span></small>`);
    }
  }
}

function checkProfit(callback) {
  log.info('Checking profit');
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
          // For switching we need more profit
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
    if(instructions !== undefined) {
      var miner;
      for(idx in miners) { if(miners[idx].alias == instructions.alias) {miner = miners[idx]; }}
      callback(instructions, miner);
    } else {
      $("#hash").removeClass("text animated pulse infinite")
                .html("Hash!");
    }
  });
}

// Hash hash hash
var average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
$("#hash").click(function() {
  $(this).html("Initializing");
  $(".menu").prop( "disabled", true );
  if(Object.keys(mining).length == 0) {
    checkProfit(function(instructions, miner) {
      // If we got a max profit algo
      cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, instructions.algo, intensities[`${instructions.algo}-${instructions.alias}`], instructions["stratum"], gpus_to_use, false);
      donate_cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, instructions.algo, intensities[`${instructions.algo}-${instructions.alias}`], instructions["stratum"], gpus_to_use, true);
      startMining(instructions, false);
    })
  } else {
    $(".menu").prop( "disabled", false );
    relaunch.do = false;
    mining.process.kill();
    mining = {};
  }
});

function estimateProfit(instructions, avgHR) {
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

function startMining(instructions, donate){
  log.info(`Starting to mine`);
  log.info(instructions)
  $("#hash").addClass("text animated pulse infinite")
            .html(`&nbsp;Hashing...<small class="miningStats">${instructions.algo}<br>on ${config.pools[instructions["pid"]].name}<br><span class="hr"></span></small></button`);
  $(".menu").prop( "disabled", true );
  var checkInterval = profitCheckFreq * 60000;
  var run = cmd;
  if(donate) {
    checkInterval = 60000; // check every minute if donation should stop
    run = donate_cmd;
    $("#whatsitdoing").text("♥ Donating ♥");
  } else {
    $("#whatsitdoing").text("Estimated daily");
  }
  var m = spawn(...run);
  var HRqueue = [];
  var avgHR = 0;
  mining.process = m;
  if(mining.start === undefined)
    mining.start = Date.now();
  mining.cmd = run;

  m.stdout.on('data', (data) => {
    hash = mutils.process(cmd[0], data);
    if(hash !== undefined) {
      if(HRqueue.length == 5) {
        HRqueue.shift();
      }
      HRqueue.push(hash);
      avgHR = average(HRqueue);
      $(".hr").text(mutils.pprint(avgHR));

      if(!donate) {
        estimateProfit(instructions, avgHR);
      }
    }
  });
  m.stderr.on('data', (data) => {
    hash = mutils.process(cmd[0], data);
    if(hash !== undefined) {
      if(HRqueue.length == 5) {
        HRqueue.shift();
      }
      HRqueue.push(hash);
      avgHR = average(HRqueue);
      $(".hr").text(mutils.pprint(avgHR));

      if(!donate) {
        estimateProfit(instructions, avgHR);
      }
    }
  });

  // When job is closed
  m.on('close', (code) => {
    log.info('Stop mining');
    window.clearInterval(intervalID);
    $("#hash").removeClass("text animated pulse infinite")
              .html("Hash!");
    $("#est_btc").html(``);
    $("#est_cur").html(``);
    $(".menu").prop( "disabled", false );
    if(relaunch.do == true) {
      if(relaunch.reset) {
        mining = {}; // Resets the timer
      }
      startMining(relaunch.inst, relaunch.donate);
    }
  });

  // Update BTC price and balances every 10mins
  intervalID = setInterval(function () {
    // Update sum of balances and BTC values
    var now = Date.now();
    if(!donate) {
      refreshBalance();
      checkProfit(function(new_instructions, miner) {
        var sw = false;
        // Does it suggest a different algo/pool? And is it at least smoothing% better than current?
        if(new_instructions !== undefined && new_instructions.profit > instructions.profit*(1+smoothing/100) && (new_instructions.algo != instructions.algo || new_instructions["pid"] != instructions["pid"]))
          sw = true;
        // If we decide to switch algos
        if(sw) {
          log.info('Profit switching');
          cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, new_instructions.algo, intensities[`${new_instructions.algo}-${new_instructions.alias}`], new_instructions["stratum"], gpus_to_use, false);
          donate_cmd = MiningUtils.buildCommand(binPath+miner.folder+miner.name, new_instructions.algo, intensities[`${new_instructions.algo}-${new_instructions.alias}`], new_instructions["stratum"], gpus_to_use, true);
          relaunch.do = true;
          relaunch.inst = new_instructions;
          relaunch.donate = false;
          relaunch.reset = false;
          mining.process.kill();
        }
        // It's been 10hrs
        else if(store.get("donation") > 0 && now - mining.start > 36000000) {
          log.info('Donation time');
          relaunch.do = true;
          relaunch.inst = instructions;
          relaunch.donate = true;
          relaunch.reset = true;
          mining.process.kill();
        }
        // We don't switch nor donate, so update current profit for future tests
        else {
          instructions.profit = new_instructions.profit;
        }
      });
    } else {
      // Donated enough
      // We donate 42% of the daily donation amount every 10hrs
      if(now - mining.start > percentsToMilliseconds(store.get("donation")*0.42)) {
        log.info('Donation end');
        relaunch.do = true;
        relaunch.inst = instructions;
        relaunch.donate = false;
        relaunch.reset = true;
        mining.process.kill();
      }
    }
  }, checkInterval);
}

function percentsToMilliseconds(p) {
  return Math.round(((p*86400000) * 100) / 100);
}

function refreshBalance() {
  mutils.getSumPoolBalances(function(err, sum){
    if(err || Number.isNaN(sum)) {
      $(".glyphicon-exclamation-sign").show();
    } else {
      $(".glyphicon-exclamation-sign").hide();
      store.set("balance", sum);
    }
    updateCurrency();
  });
}
refreshBalance();

// Go to introduction if first time
if(store.get("intro") == false) {
  ipcRenderer.send('changePage', "intro");
}
