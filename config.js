var config = {}

config.debug = true;

config.miners = [
  {
    "name": "ccminerTPruvot",
    "exe": "ccminer-64"
    "hardware": "nvidia",
    "URL": "https://github.com/tpruvot/ccminer/releases/download/2.2.3-tpruvot/ccminer-x64-2.2.3-cuda9.7z",
    "folder": "ccminerTPruvot/",
    "algos": ["bitcore","blake2s","blakecoin","vanilla","c11","cryptonight","decred","equihash","groestl","hmq1725","jha","keccak","lbry","lyra2v2","lyra2z","myr-gr","neoscrypt","nist5","pascal","phi","sia","sib","skein","skunk","timetravel","tribus","veltor","x11evo","x17"]
  },
  {
    "name": "ccminerAlexis78",
    "algos": ["hsr","blake2s","blakecoin","veltor","lyra2v2","myr-gr","nist5","sib","skein","c11","x17"]
  }
]

/* Example of API output
"x11": {
		"name": "x11",
		"port": 3533,
		"coins": 10,
		"fees": 1,
		"hashrate": 269473938,
		"workers": 5,
		"estimate_current": "0.00053653",
		"estimate_last24h": "0.00036408",
		"actual_last24h": "0.00035620",
		"hashrate_last24h": 269473000,
		"rental_current": "3.61922463"
	},
  */
config.pools = [
  {
    "name": "zpool",
    // "regions": [["US","us"], ["EU","eu"], ["Asia","asia"]],
    "home_URL": "http://www.zpool.ca/",
    "mine_URL": "mine.zpool.ca",
    "API_URL": "http://www.zpool.ca/api/",
    "API_status": "status",
    "API_wallet": "wallet?address=",
    "currency": "btc"
  }
]

// I think I need a translation table for algos...
config.algos = [
  {}
]

module.exports = config;
