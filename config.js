var config = {}

config.debug = true;

config.miners = [
  {
    "name": "ccminer",
    "URL": "https://github.com/nicehash/ccminer-nanashi/releases/download/1.7.6-r6/ccminer.zip",
    "folder": "lyra2rev2-ccminer/",
    "algos": ['blake','blakecoin','blake2s','bmw','c11','flax','decred','deep','dmd-gr','fresh','fugue256','groestl','heavy','jackpot','keccak','luffa','lyra2','mjollnir','myr-gr','neoscrypt','nist5','penta','quark','qubit','scrypt','scrypt:N','scrypt-jane','s3','sib','skein','skein2','x11','x14','x15','x17','vanilla','whirlpool','zr5']
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
