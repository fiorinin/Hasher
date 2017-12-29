var config = {}

config.debug = true;

// Given how frequently pools fail, we need at least some caching...
config.cache = {
  "pools": {}
};

// Successive calls to APIs
config.retry_nb = 0;
config.retry_delay = 10000;

// Benchmark speeds
config.speed = {
  "fast": 30000,
  "regular": 120000,
  "slow": 180000,
}

// Supported miners
config.miners = [
  {
    "name": "ccminer-x64",
    "alias": "tpruvot",
    "hardware": "nvidia",
    "URL": "https://github.com/tpruvot/ccminer/releases/download/2.2.3-tpruvot/ccminer-x64-2.2.3-cuda9.7z",
    "folder": "ccminerTPruvot/",
    "algos": ["bitcore","blake2s","blakecoin","vanilla","c11","cryptonight","decred","equihash","groestl","hmq1725","jha","keccak","lbry","lyra2v2","lyra2z","myr-gr","neoscrypt","nist5","pascal","phi","sia","sib","skein","skunk","timetravel","tribus","veltor","x11evo","x17"]
  },
  {
    "name": "ccminer-alexis",
    "alias": "alexis78",
    "hardware": "nvidia",
    "URL": "https://github.com/nemosminer/ccminer-hcash/releases/download/alexishsr/ccminer-hsr-alexis-x86-cuda8.7z",
    "folder": "ccminerAlexis78/",
    "algos": ["hsr", "x17"] // add x17
  },
  {
    "name": "ccminer",
    "alias": "klaust",
    "hardware": "nvidia",
    "URL": "https://github.com/KlausT/ccminer/releases/download/8.15/ccminer-815-cuda9-x64.zip",
    "folder": "ccminerKlausT/",
    "algos": ["groestl","myr-gr","neoscrypt"]
  },
  {
    "name": "ccminer",
    "alias": "nanashi",
    "hardware": "nvidia",
    "URL": "https://github.com/nicehash/ccminer-nanashi/releases/download/1.7.6-r6/ccminer.zip",
    "folder": "ccminerNanashi/",
    "algos": ["lyra2v2"]
  },
  {
    "name": "ccminer_cuda9",
    "alias": "mscv2015",
    "hardware": "nvidia",
    "URL": "https://github.com/djm34/ccminer-msvc2015/releases/download/v0.2.1/ccminer_cuda9.exe",
    "folder": "ccminermsvc2015/",
    "algos": ["lyra2z"]
  },
  {
    "name": "ccminer",
    "alias": "meiyo",
    "hardware": "nvidia",
    "URL": "https://github.com/Nanashi-Meiyo-Meijin/ccminer/releases/download/v2.2-mod-r2/2.2-mod-r2-CUDA9.binary.zip",
    "folder": "ccminerNanashiMeiyo/",
    "zipdir": "ccminer-2.2-mod-r2-CUDA9",
    "algos": ["jha","lyra2z","neoscrypt"]
  },
  {
    "name": "ccminer",
    "alias": "poly",
    "hardware": "nvidia",
    "URL": "https://github.com/punxsutawneyphil/ccminer/releases/download/polytimosv2/ccminer-polytimos_v2.zip",
    "folder": "ccminerPoly/",
    "algos": ["poly"]
  },
  {
    "name": "ccminer_x11gost",
    "alias": "x11gost",
    "hardware": "nvidia",
    "URL": "https://github.com/nicehash/ccminer-x11gost/releases/download/ccminer-x11gost_windows/ccminer_x11gost.7z",
    "folder": "ccminerX11gost/",
    "algos": ["sib"]
  },
  {
    "name": "ccminer",
    "alias": "scaras",
    "hardware": "nvidia",
    "URL": "https://github.com/scaras/ccminer-2.2-mod-r1/releases/download/2.2-r1/2.2-mod-r1.zip",
    "folder": "ccminerSkunk/",
    "zipdir": "ccminer-2.2-mod-r1",
    "algos": ["skunk"]
  },
  {
    "name": "ccminer",
    "alias": "sp",
    "hardware": "nvidia",
    "URL": "https://github.com/sp-hash/ccminer/releases/download/1.5.81/release81.7z",
    "folder": "ccminerSp/",
    "zipdir": "release81",
    "algos": ["c11","skein","x17"]
  },
  {
    "name": "ccminer_x86",
    "alias": "nemoxevan",
    "hardware": "nvidia",
    "URL": "https://github.com/nemosminer/ccminer-xevan/releases/download/ccminer-xevan/ccminer_x86.7z",
    "folder": "ccminerXevan/",
    "algos": ["xevan"]
  }
]

// Supported pools
config.pools = [
  {
    "name": "zpool",
    // "regions": [["US","us"], ["EU","eu"], ["Asia","asia"]],
    "home_URL": "http://www.zpool.ca/",
    "mine_URL": "mine.zpool.ca",
    "API_URL": "http://www.zpool.ca/api/",
    "failover_URL": "http://www.zpool.ca/site/current_results",
    "API_status": "status",
    "API_wallet": "wallet?address=",
    "currency": "btc",
    // Daily profit = (HR/coin_unit) * multiplier * exchange (estimated) [* BTC value for USD/EUR]
    "profit_multiplier": 0.001,
    "coin_unit": {
      "sha56":      1000000000000000,
      "scrypt":     1000000000,
      "blake2s":    1000000000,
      "blakecoin":  1000000000,
      "decred":     1000000000,
      "keccak":     1000000000,
      "x11":        1000000000,
      "quark":      1000000000,
      "qubit":      1000000000,
      "default":    1000000,
      "equihash":   1000,
    }
  }
]

config.decimals = {
  btc : 100000000, // 8 decimals for BTC
  cur : 100 // 2 decimals for currency
}

// TODO: I think I will need a translation table for algos...
config.algos = [
  {}
]

module.exports = config;
