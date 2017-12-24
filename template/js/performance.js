const Store = require('electron-store');
const store = new Store();
var config = store.get("config");
const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const app = remote.app;
var AdmZip = require('adm-zip');
var request = require('request');
var fs   = require('fs');
var spawn = require('child_process').spawn;
const async = require('async');
const MiningUtils = require("../../controls/miningutils.js");
const mutils = new MiningUtils();
var cancelBenchmark = false;
var binPath = app.getPath('userData') +"/bin/";

// Detect GPUs can take a while and is handled backend
ipcRenderer.on("gpus", function(e,d) {
  if (d == "ok") {
    updateGPUs();
  }
})

// Declare GPUs to use, list them
var selected = store.get("gpus_to_use");
updateGPUs();

// (De)select GPUs
$(".list-group-item").click(function() {
  $(this).toggleClass("active");
  var gpuid = parseInt($(this).attr('id').replace("gpuid_", ""));
  var idx = $.inArray(gpuid, selected);
  if (idx == -1) {
    selected.push(gpuid);
  } else {
    selected.splice(idx, 1);
  }
  if (selected.length > 0) {
    $("#benchmark").removeClass("disabled");
  } else if (!$("#benchmark").hasClass("disabled")){
    $("#benchmark").addClass("disabled");
  }
  store.set("gpus_to_use", selected);
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

// Cancel benchmark consists of flagging the execution and hide benchmark
$("#cancel_bench").click(function() {
  cancelBenchmark = true;
  $(".loadpopup").addClass("hidden");
  //bar.animate(0, function() {}); // cool but for later
})

// Stats popup
$(".stats").click(function(event) {
  event.stopPropagation();
  var gpuid = $(this).attr("id").replace("stats_", "");
  $("#gpuname").html("Statistics for GPU #"+gpuid);
  var stats = store.get("benched")[gpuid];
  $("#gpustats>tbody").html("");
  for (stat in stats) {
    var hr = mutils.pprint(stats[stat]);
    var checked = "";
    var enabled_algos = store.get("enabled_algos");
    if(enabled_algos[stat] === undefined){
      enabled_algos[stat] = true;
      store.set("enabled_algos", enabled_algos);
    }
    if(enabled_algos[stat] == true) {
      checked = "checked";
    }
    var checkbox = `<div class="pretty p-icon p-jelly">
                      <input type="checkbox" class="ealgo" id="enable_${stat}" ${checked}/>
                        <div class="state p-primary-o">
                            <i class="icon glyphicon glyphicon-check"></i>
                            <label></label>
                        </div>
                    </div>`
    $("#gpustats>tbody").append("<tr><td>"+stat+"</td><td>"+hr+"</td><td>"+checkbox+"<td></tr></li>");
  }
  $(".statspopup").removeClass("hidden");
});

// Enable/disable algos
$(document.body).on('change', '.ealgo' ,function(){
  var algo = $(this).attr("id").split("_")[1];
  var enabled_algos = store.get(enabled_algos);
  if($(this).is(":checked")) {
    enabled_algos[algo] = true;
  } else {
    enabled_algos[algo] = false;
  }
  store.set("enabled_algos", enabled_algos);
})

// Close stats popup
$("#closeStats").click(function() {
  $(".statspopup").addClass("hidden");
})

// Click on benchmark: DL miners first and verify requirements
$("#benchmark").click(function() {
  if ($(this).hasClass("disabled")) {
    return false;
  }
  $(".loadpopup").removeClass("hidden");

  // First, check miners are here and if not, download
  $("#action").text("Downloading miners...");
  var miners = config.miners;
  var increment = 1/miners.length;
  var barval = 0;
  var doneMiner = 0;
  var promises = [];
  for(var idx in miners) {
    var miner = miners[idx];
    // Only eligible miners
    var hardware = store.get("hardware");
    if (miner.hardware != hardware) {
      continue;
    }
    // Check if we have a bin directory
    if (!fs.existsSync(binPath)) {
      fs.mkdirSync(binPath);
    }
    if (!fs.existsSync(binPath+miner.folder+miner.name+".exe")) {
      if (!fs.existsSync(binPath+miner.folder)) {
        fs.mkdirSync(binPath+miner.folder);
      }
      request(miner.URL)
          .pipe(fs.createWriteStream(binPath+miner.folder+miner.name+".zip"))
          .on('close', function () {
            barval += increment*0.8;
            bar.animate(barval);
            var zip = new AdmZip(binPath+miner.folder+miner.name+".zip");
            zip.extractAllTo(binPath+miner.folder, true);
            barval += increment*0.2;
            bar.animate(barval);
            doneMiner += 1;
            if(doneMiner == miners.length) {
              benchmark();
            }
          });
    } else {
      doneMiner += 1;
      if(doneMiner == miners.length) {
        benchmark();
      }
    }
  }
})

// Actual benchmark happens here...
var average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
function benchmark() {
  $("#action").text("Benchmarking...");

  // First some checks. Pool(s) and address defined?
  var wallet = store.get("wallet");
  if (wallet === undefined) {
    $("#error").html("Please set a wallet address to start.");
    $("#action").text("Error");
    return false;
  }
  var spools = store.get("selectedPools");
  if (spools === undefined || spools.length == 0) {
    $("#error").html("Please select at least one pool to start.");
    $("#action").text("Error");
    return false;
  }
  var hardware = store.get("hardware");
  if (hardware === undefined) {
    $("#error").html("Please your hardware (Nvidia or AMD) in 'Wallet & settings' first.");
    $("#action").text("Error");
    return false;
  }

  // Benchmark: for all eligible miners, bench all algos on the first favorite pool
  var miners = config.miners;
  var cmds = [];
  var pool = config.pools[spools[0]];
  for(gid in selected) {
    for(var midx in miners) {
      var miner = miners[midx];
      // Only eligible miners
      if (miner.hardware != hardware) {
        continue;
      }
      for(aidx in miner.algos) {
        // TODO: fetch pool data
        // TODO: Run miner only on algorithms each pool accepts. For now stick to zpool
        cmds.push({
          "name": miner.name,
          "algo": miner.algos[aidx],
          "port": "4533",
          "gpu": selected[gid]
        });
      }
    }
  }

  // Progress bar increments: #miners.algos * #pools
  var benchtime = store.get("benchtime");
  var shares = cmds.length;
  var increment = 1/shares;
  var barval = 0;
  var barRefreshFraction = 20;

  // async but nonparallel mining bench
  async.each(cmds, function (cmd, callback) {

    // Cancel any remaining bench if user cancelled
    if(cancelBenchmark) {
      callback();
    }

    // Spawn a job for x minutes, the longer the more accurate
    var hashes = [];
    var algo = cmd.algo;
    var gid = cmd.gpu;
    var m = spawn(binPath+miner.folder+cmd.name+".exe",["-a", algo,"-o","stratum+tcp://"+algo+"."+pool.mine_URL+":"+cmd.port, "-u", wallet, "-p", "Hasher", "-d", gid]);
    m.stdout.on('data', (data) => {
      hash = mutils.getHashrate(miner.name, new TextDecoder("utf-8").decode(data));
      if (config.debug == true) {
        console.log(hash);
      }
      if(isNumber(hash)) {
        hashes.push(hash);
      }
    });

    // When job is closed (end of this bench)
    m.on('close', (code) => {
      var avgH = average(hashes);
      if(config.debug) {
        console.log();
      }
      var benched = store.get("benched");
      console.log(benched);
      if(benched[gid] === undefined) {
        benched[gid] = {};
      }
      benched[gid][algo] = avgH;
      store.set("benched", benched);
      console.log(benched)

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
    // Reload page
    setTimeout(function(){location.reload(); }, 10000);
  });
}

// GPU list
function updateGPUs() {
  var gpus = store.get('gpus');
  if(gpus !== undefined && gpus.length > 0) {
    $("#gpuList").html("");
  }
  for (var id in gpus) {
    var dis = 'disabled';
    if (typeof store.get('benched') !== 'undefined' && typeof store.get('benched')[id] !== 'undefined') {
      dis = "";
    }
    var selected = '';
    if (typeof store.get('gpus_to_use') !== 'undefined' && typeof store.get('gpus_to_use')[id] !== 'undefined') {
      selected = " active";
      $("#benchmark").removeClass("disabled");
    }
    $("#gpuList").append("<a href='#' class='list-group-item list-group-item-action "+selected+"' id='gpuid_"+id+"'>"+gpus[id]+"<span class='pull-right'><button class='stats btn btn-xs secondary "+dis+"' id='stats_"+id+"'>Stats</button></span></a>")
  }
}
