var config = {}

config.debug = false;

config.miners = [
  {}
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

module.exports = config;
