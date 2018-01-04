const Store = require('electron-store');
const store = new Store();
const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const app = remote.app;
const binPath = app.getPath('userData') +"/bin/";
var AdmZip = require('adm-zip');
var _7z = require('7zip')['7z']
var request = require('request');
var fs   = require('fs');
var spawn = require('child_process').spawn;
const async = require('async');
const MiningUtils = require("../../controls/miningutils.js");
const Utils = require("../../controls/utilities.js");
const mutils = new MiningUtils();
var cancelBenchmark = false;
var fse = require('fs-extra');
const log = require('electron-log');

// Some global settings
var config = store.get("config");
var miners = config.miners;
var hardware = store.get("hardware");
var gpus_to_use = store.get("gpus_to_use");
var enabled_algos = store.get("enabled_algos");
var wallet = store.get("wallet");
var spools = store.get("selectedPools");
var benchtime = store.get("benchtime");
var benched = store.get("benched");
var estimate = store.get("estimate");
var intensities = store.get("intensities");

// Detect GPUs can take a while and is handled backend
ipcRenderer.on("gpus", function(e,d) {
  if (d == "ok") {
    updateGPUs();
  }
})

// Display GPUs
updateGPUs();

// (De)select GPUs
$(".list-group-item").click(function(e) {
  $(this).toggleClass("active");
  var gpuid = parseInt($(this).attr('id').replace("gpuid_", ""));
  var idx = $.inArray(gpuid, gpus_to_use);
  if (idx == -1) {
    gpus_to_use.push(gpuid);
  } else {
    gpus_to_use.splice(idx, 1);
  }
  if (gpus_to_use.length > 0) {
    $("#benchmark").removeClass("disabled");
  } else if (!$("#benchmark").hasClass("disabled")){
    $("#benchmark").addClass("disabled");
  }
  store.set("gpus_to_use", gpus_to_use);
  e.preventDefault();
})

// A lot of lines is the price of a nice progress bar...
var ProgressBar = require('progressbar.js')
var bar = new ProgressBar.Circle($("#progress")[0], {
  color: '#aaa',
  strokeWidth: 10,
  trailWidth: 1,
  easing: 'easeInOut',
  duration: 1400,
  text: {
    autoStyleContainer: false
  },
  from: { color: '#f7b733', width: 1 },
  to: { color: '#4abdac', width: 10 },
  step: function(state, circle) {
    circle.path.setAttribute('stroke', state.color);
    circle.path.setAttribute('stroke-width', state.width);

    var value = Math.round(circle.value() * 100);
    if (value === 0) {
      circle.setText('');
    } else {
      circle.setText(value);
    }

  }
});
bar.text.style.fontSize = '2rem';
bar.currentValue = 0;

// Cancel benchmark consists of flagging the execution and hide benchmark
$("#cancel_bench").click(function() {
  cancelBenchmark = true;
  $(".loadpopup").addClass("hidden");
  //bar.animate(0, function() {}); // cool but for later
})

// Eligible algos
listedAlgos = [];
for (var i = 0; i < miners.length; i++) {
  var miner = miners[i];
  if(miner.hardware == hardware) {
    for(var j = 0; j < miner.algos.length; j++) {
      var algo = `${miner.algos[j]}-${miner.alias}`;
      if(listedAlgos.indexOf(algo) == -1) {
        listedAlgos.push(algo);
      }
    }
  }
}
listedAlgos.sort();

// Enable/disable algos
$(document.body).on('change', '.ealgo' ,function(){
  var algo = $(this).attr("id").split("_")[1];
  enabled_algos[algo] = $(this).is(":checked");
  store.set("enabled_algos", enabled_algos);
})

// Algorithm popup
$("#pick_algos").click(function(event) {
  $(".algopopup").removeClass("hidden");
});

var pref_cur = store.get("pref_cur");
var currency_value = store.get(`btc${pref_cur}`);
$("#pref_cur").text(`Estimated ${pref_cur.toUpperCase()}/day`);
mutils.getMaxProfit(function(max_profit) {
  // Fill it with relevant algos
  for(var i = 0; i < listedAlgos.length; i++) {
    var algo = listedAlgos[i];
    var checked = "";
    if(enabled_algos[algo] === undefined){
      enabled_algos[algo] = true;
      store.set("enabled_algos", enabled_algos);
    }
    if(enabled_algos[algo] == true) {
      checked = "checked";
    }
    var checkbox = `<div class="pretty p-icon p-jelly checkboxSort">
                      <input type="checkbox" class="ealgo enable_${algo}" id="global_${algo}" ${checked}/>
                        <div class="state p-primary-o">
                            <i class="icon glyphicon glyphicon-check"></i>
                            <label></label>
                        </div>
                    </div>`
    var alsplit = algo.split("-");
    var algodisplay = `<b>${alsplit[0]}</b>-${alsplit[1]}`;
    var hr = mutils.pprint(benched[algo]);

    // Calculate profits
    var btcprofit = curprofit = "Unknown";
    if (hr != "Unknown") {
      var best_for_algo = max_profit[alsplit[0]];
      if(best_for_algo !== undefined) {
        var estimated_val = max_profit[estimate]
        var pid = best_for_algo["pid"];
        var pool = config.pools[pid];
        var coin_unit = pool.coin_unit.default;
        if (pool.coin_unit[alsplit[0]] !== undefined) {
          coin_unit = pool.coin_unit[alsplit[0]];
        }
        btcprofit = Math.round(benched[algo] / coin_unit * best_for_algo[estimate] * pool.profit_multiplier * config.decimals.btc) / config.decimals.btc; // Last bit means 8 decimals
        curprofit = Math.round(btcprofit * currency_value * config.decimals.cur) / config.decimals.cur;
      } else {
        btcprofit = "Unsupported"
        curprofit = "Unsupported"
      }
    }

    // Display
    var el = $(`<tr><td class="col-xs-3">${algodisplay}</td><td class="col-xs-2">${hr}</td><td class="col-xs-2">${btcprofit}</td><td class="col-xs-2">${curprofit}</td><td class="col-xs-2 text-center">${checkbox}</td></tr>`)
    table.row.add(el).draw();
    // Previous options were for a 4 column display but then filtering the table is a pain... So forget it for now, we'll scroll.
  }
});

// Close algos popup
$(".closeAlgos").click(function() {
  $(".algopopup").addClass("hidden");
});

// Select/unselect all
$(".selectAll").click(function() {
  var filter = $(this).parent().next().find("button").text();
  $(".ealgo").each(function() {
    var miner = $(this).closest("tr").find(">:first").text().split("-")[1];
    if(filter.includes("All") || filter.includes(miner)) {
      $(this).prop("checked", true).change();
    }
  })
})
$(".deselectAll").click(function() {
  var filter = $(this).parent().next().find("button").text();
  $(".ealgo").each(function() {
    var miner = $(this).closest("tr").find(">:first").text().split("-")[1];
    if(filter.includes("All") || filter.includes(miner)) {
      $(this).prop("checked", false).change();
    }
  })
})

// Sort data
var table = $("#algos").DataTable({
    "searching":   false,
    "paging":   false,
    "info":     false,
    "language": {
      "zeroRecords": "Loading data - please wait..."
    },
    "aoColumns":[
      {"sType":"string"},
      {"orderable": false},
      {"sType":"numbercase"},
      {"sType":"numbercase"},
      {"sSortDataType": "dom-checkbox", "orderSequence": [ "desc", "asc" ], "targets": [ 4 ]}
    ],

});
var fuzzyNum =function(x){
 return+x.replace(/[^\d\.\-]/g,"");
};
jQuery.fn.dataTableExt.oSort['numbercase-asc']=function(x, y){
  return fuzzyNum(x)- fuzzyNum(y);
};
jQuery.fn.dataTableExt.oSort['numbercase-desc']=function(x, y){
  return fuzzyNum(y)- fuzzyNum(x);
};
$.fn.dataTable.ext.order['dom-checkbox'] = function (settings, col) {
  return this.api().column(col, { order: 'index' }).nodes().map(function (td, i) {
      return $('input', td).is(":checked") ? '1' : '0';
  });
}


miners.forEach(function(miner) {
  $(".dropdown-menu-right").append(`<li><a href="#">${miner.alias}</a></li>`);
})

$(document.body).on('click', '.dropdown-menu li a', function(){
  var miner = $(this).text();
  $('.minerfilter').html(`${miner} <span class="caret"></span>`);
  $(this).closest(".col-xs-6").next().find(`tbody tr`).each(function() {
    if(!$(this).find(">:first").text().includes(miner) && !miner.includes("All")) {
      $(this).hide();
    } else {
      $(this).show();
    }
  });
});

// Click on benchmark: DL miners first and verify requirements
var increment = 1/miners.length;
var promises = [];
$("#benchmark").click(function() {
  if ($(this).hasClass("disabled")) {
    return false;
  }
  $(".loadpopup").removeClass("hidden");

  // First, check miners are here and if not, download
  $("#action").text("Downloading miners...");
  var barval = 0;
  for(var idx in miners) {
    var miner = miners[idx];
    // Only eligible miners
    if (miner.hardware != hardware) {
      continue;
    }
    // Check if we have a bin directory
    if (!fs.existsSync(binPath)) {
      log.info("Creating bin directory");
      fs.mkdirSync(binPath);
    }
    if (!fs.existsSync(binPath+miner.folder+miner.name+".exe")) {
      if (!fs.existsSync(binPath+miner.folder)) {
        log.info(`${miner.folder+miner.name} missing, creating folder.`)
        fs.mkdirSync(binPath+miner.folder);
      }
      promises.push(miner)
    } else {
      log.info(`${miner.folder+miner.name} already downloaded and ready to use.`)
      bar.currentValue += increment;
      bar.animate(bar.currentValue);
    }
  }
  // Fetch and unzip needed miners one by one
  async.eachSeries(promises, function(miner, callback) {
    fetchAndUnzip(miner, function(validate) {
      DLComplete(validate, miner, function() {
        log.info(`Done with miner ${miner.folder+miner.name}`)
        callback(null);
      })
    })
  }, function() {
    benchmark();
  });
})

// Fetch and unzip a file
function fetchAndUnzip(miner, callback) {
  var splitURL = miner.URL.split("/");
  var zipfile = splitURL[splitURL.length-1];
  var path = binPath+miner.folder;
  log.info(`Downloading ${miner.folder+miner.name}.`)
  request(miner.URL)
  .pipe(fs.createWriteStream(path+zipfile))
  .on('close', function () {
    log.info(`${miner.folder+miner.name} downloaded.`)
    bar.currentValue += increment*0.8;
    var validate = increment*0.2;
    bar.animate(bar.currentValue);
    // .zip
    if(zipfile.includes(".zip")){
      log.info(`Unzipping ${miner.folder+miner.name}.`)
      var zip = new AdmZip(path+zipfile);
      try {
        zip.extractAllTo(path, true);
      } catch(e) {
        log.error(`Error when unzipping: ${e}`)
      }
      log.info(`${miner.folder+miner.name} unzipped.`)
      callback(validate);
    }
    // .7z
    else if(zipfile.includes(".7z")) {
      log.info(`Unzipping (7z) ${miner.folder+miner.name}.`)
      var task = spawn(_7z, ['x', path+zipfile, '-o'+path, '-y']);
      task.on('close', (code) => {
        log.info(`${miner.folder+miner.name} unzipped (7z).`)
        callback(validate);
      });
      task.on('error', function(err) {
        log.error(`Error when unzipping: ${err}`)
      });
    }
    // No zip
    else {
      log.info(`${miner.folder+miner.name} already unzipped.`)
      callback(validate);
    }
  });
}

function DLComplete(i, miner, callback) {
  // Folderception
  if(miner.zipdir !== undefined) {
    // Async move everything in parent folder
    fse.move(binPath+miner.folder+miner.zipdir, binPath+miner.folder)
    .then(() => {
      bar.currentValue += i;
      bar.animate(bar.currentValue)
      callback();
    });
  } else {
    // Nothing to move
    bar.currentValue += i;
    bar.animate(bar.currentValue);
    callback();
  }
}

// Benchmark setup happens here...
function benchmark() {
  log.info("Starting benchmark");
  bar.currentValue = 0;
  bar.animate(bar.currentValue);
  $("#action").text("Loading pool data...");

  // First some checks. Pool(s) and address defined?
  if (wallet === undefined) {
    $("#error").html("Please set a wallet address to start.");
    $("#action").text("Error");
    return false;
  }
  if (spools === undefined || spools.length == 0) {
    $("#error").html("Please select at least one pool to start.");
    $("#action").text("Error");
    return false;
  }
  if (hardware === undefined) {
    $("#error").html("Please your hardware (Nvidia or AMD) in 'Wallet & settings' first.");
    $("#action").text("Error");
    return false;
  }

  // Benchmark: for all eligible miners, bench all algos on the first eligible pool
  // Instead of checking HR on 1 pool, get all selected pools' algos,
  // all selected algos, then associate a pool for each algo
  // Fetch pool data
  mutils.getStratums(true, function(algosInPools) {
    if(Object.keys(algosInPools).length == 0) {
      $("#error").html("Could not load any pool data. Please try again later or pick other pools.");
      return false;
    }
    $("#error").html("");
    var cmds = [];
    for(var midx in miners) {
      var miner = miners[midx];
      // Only eligible miners
      if (miner.hardware != hardware) {
        continue;
      }
      for(aidx in miner.algos) {
        var algo = miner.algos[aidx];
        var alias = `${algo}-${miner.alias}`
        if(enabled_algos[alias] && algosInPools[algo] !== undefined) {
          cmds.push([alias, MiningUtils.buildCommand(binPath+miner.folder+miner.name, algo, intensities[alias], algosInPools[algo]["stratum"], gpus_to_use, false)]);
        }
      }
    }

    $("#action").text("Benchmarking...");
    // Progress bar increments: # algos (even non unique)
    var shares = cmds.length;
    var increment = 1/shares;
    var barval = 0;
    var barRefreshFraction = 20;
    var gid = gpus_to_use.join(",");

    // async but nonparallel mining bench
    async.eachSeries(cmds, function (cmd, callback) {
      var algo = cmd[0];
      cmd = cmd[1];

      // Cancel any remaining bench if user cancelled
      if(cancelBenchmark) {
        callback();
      }

      // Spawn a job for x minutes, the longer the more accurate
      var hashes = [];
      var m = spawn(...cmd);
      m.stdout.on('data', (data) => {
        var hash = mutils.process(cmd[0], data);
        if(hash !== undefined) {
          hashes.push(hash);
        }
      });
      m.stderr.on('data', (data) => {
        var hash = mutils.process(cmd[0], data);
        if(hash !== undefined) {
          hashes.push(hash);
        }
      });

      // When job is closed (end of this bench)
      m.on('close', (code) => {
        var avgH = Utils.average(hashes);
        if(config.debug) {
          console.log(`logged: ${avgH}`);
        }
        // If new bench or bench was with other GPU set, reset
        if(benched.gpus === undefined || benched.gpus != gid) {
          benched = {};
          benched.gpus = gid;
        }
        benched[algo] = avgH;
        store.set("benched", benched);
        callback();
      });

      // Update progress frequently, then close job
      var x = 0;
      var intervalID = setInterval(function () {
        barval += increment/barRefreshFraction;
        bar.animate(barval);
         if (++x === barRefreshFraction) {
             window.clearInterval(intervalID);
             m.kill();
         }
      }, benchtime/barRefreshFraction);
    }, function () {
      // Close popup by reloading
      location.reload();
    });
  });
}

// Display GPU list
function updateGPUs() {
  var gpus = store.get('gpus');
  if(gpus !== undefined && gpus.length > 0) {
    $("#gpuList").html("");
  }
  for (var id in gpus) {
    var selected = '';
    if (gpus_to_use !== undefined && gpus_to_use.indexOf(+id) !== -1) {
      selected = " active";
      $("#benchmark").removeClass("disabled");
    }
    $("#gpuList").append("<a href='#' class='list-group-item list-group-item-action "+selected+"' id='gpuid_"+id+"'>"+gpus[id]+"</a>");
  }
}

// TODO: This is a duplicate from index, I should make it cleaner instead of repeating code
// Fetch BTC value
var https = require('https');
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
      });
  })
}
updateCurrency();

// Intro section
if(store.get("intro") == false) {
  if(Object.keys(benched).length == 0) {
    $("#next").hide();
  }
  $("#back").hide();
} else {
  $("#benchinfo").show();
  $("#next").hide();
}

$("#next").click(function() {
  store.set("intro", true);
  const {ipcRenderer} = require('electron');
  ipcRenderer.send('changePage', "end");
});
