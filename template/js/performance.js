const Store = require('electron-store');
const store = new Store();
const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const app = remote.app;
var AdmZip = require('adm-zip');
var _7z = require('7zip')['7z']
var request = require('request');
var fs   = require('fs');
var spawn = require('child_process').spawn;
const async = require('async');
const MiningUtils = require("../../controls/miningutils.js");
const mutils = new MiningUtils();
var cancelBenchmark = false;
const binPath = app.getPath('userData') +"/bin/";
var fse = require('fs-extra');

// Some global settings
var config = store.get("config");
var miners = config.miners;
var hardware = store.get("hardware");
var gpus_to_use = store.get("gpus_to_use");
var enabled_algos = store.get("enabled_algos");
var wallet = store.get("wallet");
var spools = store.get("selectedPools");
var benchtime = store.get("benchtime");

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

// Stats popup
$(".stats").click(function(event) {
  if ($(this).hasClass("disabled")) {
    return false;
  }
  // TODO: manage algos before first bench
  event.stopPropagation();
  var gpuid = $(this).attr("id").replace("stats_", "");
  $("#gpuname").html("Statistics for GPU #"+gpuid);
  var stats = store.get("benched")[gpuid];
  $("#gpustats>tbody").html("");
  // Todo: wrong, for all algos available for this hardware...
  for (stat in stats) {
    var hr = mutils.pprint(stats[stat]);
    var checked = "";
    if(enabled_algos[stat] === undefined){
      enabled_algos[stat] = true;
      store.set("enabled_algos", enabled_algos);
    }
    if(enabled_algos[stat] == true) {
      checked = "checked";
    }
    var checkbox = `<div class="pretty p-icon p-jelly">
                      <input type="checkbox" class="ealgo enable_${stat}" ${checked}/>
                        <div class="state p-primary-o">
                            <i class="icon glyphicon glyphicon-check"></i>
                            <label></label>
                        </div>
                    </div>`
    $("#gpustats>tbody").append("<tr><td>"+stat+"</td><td>"+hr+"</td><td>"+checkbox+"<td></tr>");
  }
  $(".statspopup").removeClass("hidden");
});

// Enable/disable algos
$(document.body).on('change', '.ealgo' ,function(){
  var algo = $(this).attr("id").split("_")[1];
  enabled_algos[algo] = $(this).is(":checked");
  // Update all similar checkboxes
  $(`.enable_${algo}`).prop('checked', $(this).is(":checked"));
  store.set("enabled_algos", enabled_algos);
})

// Close stats popup
$("#closeStats").click(function() {
  $(".statspopup").addClass("hidden");
})

// Algorithm popup
$("#pick_algos").click(function(event) {
  $(".algopopup").removeClass("hidden");
});

// Fill it with relevant algos
listedAlgos = [];
for (var i = 0; i < miners.length; i++) {
  var miner = miners[i];
  if(miner.hardware == hardware) {
    for(var j = 0; j < miner.algos.length; j++) {
      var algo = miner.algos[j];
      if(listedAlgos.indexOf(algo) == -1) {
        listedAlgos.push(algo);
      }
    }
  }
}
listedAlgos.sort();
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
  var checkbox = `<div class="pretty p-icon p-jelly">
                    <input type="checkbox" class="ealgo enable_${algo}" ${checked}/>
                      <div class="state p-primary-o">
                          <i class="icon glyphicon glyphicon-check"></i>
                          <label></label>
                      </div>
                  </div>`
  if(i % 2 == 0) {
    $("#algos>tbody").append(`<tr><td>${algo}</td><td>${checkbox}</td></tr>`);
  } else {
    $("#algos>tbody>tr:last").append(`<td>${algo}</td><td>${checkbox}</td>`);
  }
}

// Close algos popup
$("#closeAlgos").click(function() {
  $(".algopopup").addClass("hidden");
})

// Click on benchmark: DL miners first and verify requirements
var doneMiner;
$("#benchmark").click(function() {
  if ($(this).hasClass("disabled")) {
    return false;
  }
  $(".loadpopup").removeClass("hidden");
  doneMiner = 0;

  // First, check miners are here and if not, download
  $("#action").text("Downloading miners...");
  var increment = 1/miners.length;
  var barval = 0;
  var promises = [];
  for(var idx in miners) {
    var miner = miners[idx];
    // Only eligible miners
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
      console.log(`I miss ${binPath+miner.folder+miner.name}.exe`)
      fetchAndUnzip(miner,increment);
    } else {
      bar.currentValue += increment;
      bar.animate(bar.currentValue);
      doneMiner += 1;
      if(doneMiner == miners.length) {
        benchmark();
      }
    }
  }
})

// Fetch and unzip a file
function fetchAndUnzip(miner,increment) {
  var splitURL = miner.URL.split("/");
  var zipfile = splitURL[splitURL.length-1];
  var path = binPath+miner.folder;
  request(miner.URL)
  .pipe(fs.createWriteStream(path+zipfile))
  .on('close', function () {
    bar.currentValue += increment*0.8;
    var validate = increment*0.2;
    bar.animate(bar.currentValue);
    if(zipfile.includes(".zip")){
      var zip = new AdmZip(path+zipfile);
      zip.extractAllTo(path, true);
      DLComplete(validate,miner);
    } else if(zipfile.includes(".7z")) {
      var task = spawn(_7z, ['x', path+zipfile, '-o'+path, '-y']);
      task.on('close', (code) => {
        DLComplete(validate,miner);
      });
    } else {
      DLComplete(validate,miner);
    }
  });
}

function DLComplete(i,miner) {
  // Folderception
  if(miner.zipdir !== undefined) {
    fse.move(binPath+miner.folder+miner.zipdir, binPath+miner.folder, console.error);
  }
  bar.currentValue += i;
  bar.animate(bar.currentValue);
  doneMiner += 1;
  if(doneMiner == miners.length) {
    benchmark();
  }
}

// Benchmark setup happens here...
var average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;
function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
function benchmark() {
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
  mutils.getPoolData(true, function(algosInPools) {
    if(Object.keys(algosInPools).length == 0) {
      $("#error").html("Could not load any pool data. Please try again later or pick other pools.");
      return false;
    }
    $("#error").html("");
    var cmds = [];
    var testedAlgos = []; // Store the algos we could set for test (in case some algos are only on some pools)
    for(gid in gpus_to_use) {
      for(var midx in miners) {
        var miner = miners[midx];
        // Only eligible miners
        if (miner.hardware != hardware) {
          continue;
        }
        for(aidx in miner.algos) {
          var algo = miner.algos[aidx];
          if(testedAlgos.indexOf(algo) == -1 && algosInPools[algo] != -1) {
            // TODO: use a command builder with placeholders...
            cmds.push({
              "exe": binPath+miner.folder+miner.name,
              "algo": algo,
              "stratum": algosInPools[algo],
              "gpu": gpus_to_use[gid]
            });
            testedAlgos.push(algo)
          }
        }
      }
    }
  });
  return false;
  $("#action").text("Benchmarking...");

  // Progress bar increments: # algos (even non unique)
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

    m.stderr.on('data', (data) => {
      err = new TextDecoder("utf-8").decode(data);
      if (config.debug == true) {
        console.log(err);
      }
    });

    // When job is closed (end of this bench)
    m.on('close', (code) => {
      var avgH = average(hashes);
      if(config.debug) {
        console.log();
      }
      var benched = store.get("benched");
      if(benched[gid] === undefined) {
        benched[gid] = {};
      }
      benched[gid][algo] = avgH;
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
    // Reload page
    setTimeout(function(){location.reload(); }, 10000);
  });
}

// Display GPU list
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
    $("#gpuList").append("<a href='#' class='list-group-item list-group-item-action "+selected+"' id='gpuid_"+id+"'>"+gpus[id]+"<span class='pull-right'><button class='stats btn btn-xs secondary "+dis+"' id='stats_"+id+"'>Statistics</button></span></a>");
  }
}

// Intro section
if(store.get("intro") == false) {
  $("#back").hide();
} else {
  $("#benchinfo").show();
}
