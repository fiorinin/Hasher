const Store = require('electron-store');
const store = new Store();
var config = store.get("config");
var retry = require('requestretry');
var request = require("request");

module.exports = class MiningUtils {
  constructor() {
    this.minerOutputs = {
      // miner name => output type
      "ccminer": "ccminer"
    }
  }

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
    if(hashrate > 1000000000000)
      return Math.round((hashrate/1000000000000)*100)/100+"TH/s";
    if(hashrate > 1000000000)
      return Math.round((hashrate/1000000000)*100)/100+"GH/s";
    if(hashrate > 1000000)
      return Math.round((hashrate/1000000)*100)/100+"MH/s";
    if(hashrate > 1000)
      return Math.round((hashrate/1000)*100)/100+"KH/s";
  }

  getHashrate(miner, string) {
    switch (this.minerOutputs[miner]) {
      case "ccminer":
        return this.parseCcminer(string);
    }
  }

  parseCcminer(string) {
    var sp = string.split(",");
    var h = sp[sp.length-1];
    if(h.includes("/s")) {
      h = h.trim();
      var val_unit = h.match(/[a-z]+|[^a-z]+/gi);
      return this.uniform(val_unit[0], val_unit[1].toLowerCase());
    }
    return "not a hash: \n"+string;
  }

  __retryStrategy(err, response, body) {
    if(err !== undefined || body.length == 2) {
      $("#error").text("Error in contacting pool. Retrying...");
      return true;
    }
  }

  /* What a mess... Anyway:
   * This returns something like { poolid: { algo: {stratum: text, ...}, ...}, ...}
   * iff unique is false (i.e. we want stratums for all algos for all pools, good when calculating profit)
   * If unique, returns something with this shape: { algo: {stratum: text, ...}, ...}, ...}
   * That is, a single stratum URI for each algo, good for benchmarking only.
   */
  getPoolData(unique, callback) {
    var spools = store.get("selectedPools");
    var poolsRetrieved = 0;
    var algosInPools = {};
    for(let i = 0; i < spools.length; i++) {
      var pid = spools[i];
      var pool = config.pools[pid]
      var url = `${pool.API_URL}${pool.API_status}`;

      // Return data for all pools or just the first matching one
      if(!unique) { algosInPools[pid] = {}};

      // Try API x times spaced by y sec
      retry({
        url: url,
        json: true,
        maxAttempts: config.retry_nb,
        retryDelay: config.retry_delay,
        retryStrategy: this.__retryStrategy
      }, function(err, response, body){
        // Zpool
        if(pid == 0) {
          // Shiiieeeeet
          if ((err || body.length == 2) && config.cache["pools"][pid] === undefined)  {
            // Then let's go parse the actual homepage...
            request(pool.failover_URL, function (error, response, body) {
              if(error != null) {
                // If impossible either, well, too bad!
                $("#error").text("Could not contact pool. Moving to next preferred pool...");
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
                  if(algosInPools[algo] === undefined && unique) {
                    algosInPools[algo] = {"stratum": MiningUtils.buildStratum(pool.mine_URL, algo, port, pid), "current_estimate": tds[6].innerHTML, "24h_estimated": tds[7].innerHTML, "24h_actual": tds[8].innerHTML};
                  } else if(!unique) {
                    algosInPools[pid][algo] = {"stratum": MiningUtils.buildStratum(pool.mine_URL, algo, port, pid), "current_estimate": tds[6].innerHTML, "24h_estimated": tds[7].innerHTML, "24h_actual": tds[8].innerHTML};
                  }
                }
                // Done
                poolsRetrieved++;
                if(poolsRetrieved == spools.length) {
                  callback(algosInPools);
                }
              }
            });
          } else {
            // We can't reach it but we have cache (!!!)
            if(config.cache["pools"][pid] !== undefined) {
              body = config.cache["pools"][pid];
            } else { // We actually reached it without cache, EZPZ (but store it nonetheless)
              config.cache["pools"][pid] = body;
              store.set("config", config);
            }
            // Let's parse that
            for (const [key, value] of Object.entries(body)) {
              // Add this item to the list to benchmark potentially
              if(algosInPools[key] === undefined) {
                algosInPools[key] = {"stratum": MiningUtils.buildStratum(pool.mine_URL, key, value.port, pid), "current_estimate": value.estimate_current, "24h_estimated": value.estimate_last24h, "24h_actual": value.actual_last24h};
              } else if(!unique) {
                algosInPools[pid][algo] = {"stratum": MiningUtils.buildStratum(pool.mine_URL, algo, port, pid), "current_estimate": tds[6].innerHTML, "24h_estimated": tds[7].innerHTML, "24h_actual": tds[8].innerHTML};
              }
            }
            poolsRetrieved++;
            if(poolsRetrieved == spools.length) {
              callback(algosInPools);
            }
          }
        }
      });
    }
  }

  static buildStratum(uri, algo, port, pid, region) {
    // Zpool
    if(pid == 0) {
      return `stratum+tcp://${algo}.${uri}:${port}`;
    }
  }
}
