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

}
