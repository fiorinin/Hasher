const Store = require('electron-store');
const store = new Store();
const utilities = require("./utilities.js");
const log = require('electron-log');
var config = store.get("config");
var retry = require('requestretry');
var request = require("request");

module.exports = class MiningUtils {
  constructor() {}

  uniform(hashrate, unit) {
    var multiplier = 1
    if(unit.includes("kh")) {
      multiplier = 1000
    } else if(unit.includes("mh")) {
      multiplier = 1000000
    } else if(unit.includes("gh")) {
      multiplier = 1000000000
    } else if(unit.includes("th")) {
      multiplier = 1000000000000
    }
    return hashrate*multiplier;
  }

  pprint(hashrate) {
    if(hashrate === undefined)
      return "Unknown";
    if(hashrate > 1000000000000)
      return Math.round((hashrate/1000000000000)*100)/100+"TH/s";
    if(hashrate > 1000000000)
      return Math.round((hashrate/1000000000)*100)/100+"GH/s";
    if(hashrate > 1000000)
      return Math.round((hashrate/1000000)*100)/100+"MH/s";
    if(hashrate > 1000)
      return Math.round((hashrate/1000)*100)/100+"KH/s";
    return Math.round((hashrate)*100)/100+"H/s";
  }

  getHashrate(exe, string) {
    if(exe.includes("ccminer")) {
        return this.parseCcminer(string);
    }
  }

  parseCcminer(string) {
    var sp = string.split(",");
    var h = sp[sp.length-1];
    if(h.includes("/s") && !string.includes("GPU")) {
      h = h.trim();
      var val_unit = h.match(/[a-z]+\s?|[^a-z]+/gi);
      return this.uniform(val_unit[0], val_unit[1].toLowerCase());
    }
    return string;
  }

  process(cmd, data) {
    var message = new TextDecoder("utf-8").decode(data);
    var hash = this.getHashrate(cmd, message);
    if(utilities.isNumber(hash)) {
      if(config.debug === true)
        log.verbose(`\x1B[0;30;42m${message.trim()}`);
      return hash;
    }
    if(config.debug === true)
      log.verbose(`\x1B[0;37;44m${message.trim()}`);
  }

  __retryStrategy(err, response, body) {
    if(err !== undefined || body.length == 2) {
      // $("#error").text("Error in contacting pool. Retrying...");
      return true;
    }
  }

  /* What a mess... Anyway:
  * This returns (callback) something like { poolid: { algo: {stratum: text, ...}, ...}, ...}
  * iff unique is false (i.e. we want stratums for all algos for all pools, good when calculating profit)
  * If unique, returns something with this shape: { algo: {stratum: text, ...}, ...}, ...}
  * That is, a single stratum URI for each algo, good for benchmarking only.
  */
  getStratums(unique, callback) {
    var spools = store.get("selectedPools");
    var regions = store.get("langPools");
    var poolsRetrieved = 0;
    var algosInPools = {};
    for(let i = 0; i < spools.length; i++) {
      let pid = spools[i];
      let pool = config.pools[pid]
      let url = `${pool.API_URL}${pool.API_status}`;

      // Return data for all pools or just the first matching one
      if(!unique) { algosInPools[pid] = {}; };

      this.getPoolData(pid, function(err,algos) {
        var region = null;
        if(pool.regions !== undefined) {
          for(var rid in regions[pid]) {
            if(regions[pid][rid])
              region = pool.regions[rid];
          }
        }
        if(err != null) {
          $("#error").text("Could not contact pool. Moving to next preferred pool...");
        } else {
          algos.forEach( function(obj) {
            var algo = obj["algo"];
            var port = obj["port"];
            if(algosInPools[algo] === undefined && unique) {
              // Add this item to the list to benchmark potentially
              algosInPools[algo] = {"stratum": MiningUtils.buildStratum(pool.mine_URL, algo, port, pid, region), "estimate_current": obj["estimate_current"]*1000, "estimate_last24h": obj["estimate_last24h"]*1000, "24h_actual": obj["24h_actual"]};
            } else if(!unique) {
              // Add this item to the full list of algos per pool
              algosInPools[pid][algo] = {"stratum": MiningUtils.buildStratum(pool.mine_URL, algo, port, pid, region), "estimate_current": obj["estimate_current"]*1000, "estimate_last24h": obj["estimate_last24h"]*1000, "24h_actual": obj["24h_actual"]};
            }
          });
        }
        // Done
        poolsRetrieved++;
        if(poolsRetrieved == spools.length) {
          callback(algosInPools);
        }
      });
    }
  }

  getMaxProfit(callback) {
    this.getStratums(false, function(algosInPools) {
      var estimate = store.get("estimate");
      var max_profit = {};
      for(var pool in algosInPools) {
        for(var algo in algosInPools[pool]) {
          if(max_profit[algo] === undefined || algosInPools[pool][algo][estimate] > max_profit[algo][estimate]) {
            max_profit[algo] = algosInPools[pool][algo];
            max_profit[algo]["pid"] = pool;
          }
        }
      }
      callback(max_profit);
    })
  }

  getPoolData(pid, callback) {
    var pool = config.pools[pid]
    var url = `${pool.API_URL}${pool.API_status}`;
    var algosInPool = [];

    // Try API x times spaced by y sec
    retry({
      url: url,
      json: true,
      maxAttempts: config.retry_nb,
      retryDelay: config.retry_delay,
      retryStrategy: this.__retryStrategy
    }, function(err, response, body){
      // Zpool or aHashPool or HashRefinery
      if(pid == 0 || pid == 1 || pid == 2) {
        // Shiiieeeeet
        if ((err || body === undefined || body.length == 2) && config.cache["pools"][pid] === undefined)  {
          // Then let's go parse the actual homepage...
          request(pool.failover_URL, function (error, response, body) {
            if(error != null) {
              // If impossible either, well, too bad!
              callback("error");
            } else {
              const jsdom = require("jsdom");
              const { JSDOM } = jsdom;
              const dom = new JSDOM(body);
              var els = dom.window.document.querySelectorAll("#maintable1 tbody:first-of-type tr");
              // For each line, get all td's
              for(var j=0; j < els.length; j++) {
                var tds = els[j].querySelectorAll("td");
                var algo = tds[0].querySelector("b").innerHTML;
                var port = tds[1].innerHTML;
                if(pid == 0 || pid == 2) {
                  algosInPool.push({"algo": algo, "port": port, "estimate_current": tds[6].innerHTML.replace(/[^\d.-]/g, ''), "estimate_last24h": tds[7].innerHTML.replace(/[^\d.-]/g, ''), "24h_actual": tds[8].innerHTML.replace(/[^\d.-]/g, '')});
                } else if(pid == 1){
                  algosInPool.push({"algo": algo, "port": port, "estimate_current": tds[7].innerHTML, "estimate_last24h": tds[8].innerHTML, "24h_actual": tds[9].innerHTML});
                }
              }
              callback(null, algosInPool);
            }
          });
        } else {
          // We can't reach it but we have cache (!!!)
          if((err || body === undefined || body == "" || body.length == 2) && config.cache["pools"][pid] !== undefined) {
            body = config.cache["pools"][pid];
          } else { // We actually reached it without cache, EZPZ (but store it nonetheless)
            config.cache["pools"][pid] = body;
            store.set("config", config);
          }
          // Let's parse that
          for (const [key, value] of Object.entries(body)) {
            algosInPool.push({"algo": key, "port": value.port, "estimate_current": value.estimate_current, "estimate_last24h": value.estimate_last24h, "24h_actual": value.actual_last24h});
          }
          callback(null, algosInPool);
        }
      } else if (pid == 3) { // NiceHash
        if(err && config.cache["pools"][pid] !== undefined) {
          body = config.cache["pools"][pid];
        } else { // We actually reached it without cache, EZPZ (but store it nonetheless)
          config.cache["pools"][pid] = body;
          store.set("config", config);
        }
        // Let's parse that
        var results = body["result"]["simplemultialgo"];
        for (var idx in results) {
          var obj = results[idx];
          // Only one estimate in NiceHash, so I map it to the default estimate
          algosInPool.push({"algo": obj["name"], "port": obj["port"], "estimate_current": 0, "estimate_last24h": 0, "24h_actual": obj["paying"]});
        }
        callback(null, algosInPool);
      }
    });
  }

  getSumPoolBalances(callback) {
    var spools = store.get("selectedPools");
    var wallet = store.get("wallet");
    var poolsRetrieved = 0;
    var balances = [];
    var errors = false;
    for(let i = 0; i < spools.length; i++) {
      let pid = spools[i];
      let pool = config.pools[pid]
      let url = `${pool.API_URL}${pool.API_wallet}${wallet}`;
      request(url, function (err, response, body) {
        if(err !== null || body === undefined || body == "" || body.length == 2) {
          // There was an error
          errors = true;
        } else {
          body = JSON.parse(body);
          if(pid != 3) {
            balances.push(body["balance"]);
          } else {
            var stats = body["result"]["stats"];
            var total = 0;
            for(var idx in stats) {
              total += stats[idx]["balance"];
            }
            balances.push(total)
          }
        }
        poolsRetrieved++;
        if(poolsRetrieved == spools.length) {
          callback(errors, balances.reduce(function(a, b) { return a + b; }, 0));
        }
      });
    }
  }

  static buildStratum(uri, algo, port, pid, region) {
    // Zpool or aHashPool or HashRefinery
    if(pid == 0 || pid == 1 || pid == 2) {
      return `stratum+tcp://${algo}.${uri}:${port}`;
    } else if (pid == 3) { // NiceHash
      return `stratum+tcp://${algo}.${region}.${uri}:${port}`;
    }
  }

  static buildCommand(exe, algo, intensity, stratum, gpus, donate) {
    var p = "Hasher,c=BTC";
    var wallet = store.get("wallet");
    if(donate)
      wallet = config.donation;
    if(stratum.includes("nicehash")) {
      wallet += ".ID=Hasher";
      p = "x";
    }
    // Ccminer
    if(exe.includes("ccminer")) {
      if (intensity != "")
        return [`${exe}`, [`-a`, `${algo}`, `-i`, `${intensity}`, `-o`, `${stratum}`, `-u`, `${wallet}`, `-p`, `${p}`, `-d`, `${gpus.join(",")}`]];
      return [`${exe}`, [`-a`, `${algo}`, `-o`, `${stratum}`, `-u`, `${wallet}`, `-p`, `${p}`, `-d`, `${gpus.join(",")}`]];
    }
  }
}
