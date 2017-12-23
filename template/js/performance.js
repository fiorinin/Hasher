const Store = require('electron-store');
const store = new Store();
const ipcRenderer = require('electron').ipcRenderer;
var AdmZip = require('adm-zip');
var request = require('request');
var fs   = require('fs');
const remote = require('electron').remote;
const app = remote.app;
var child_process = require('child_process');

var cancelBenchmark = false;
var binPath = app.getPath('userData') +"/bin/";
ipcRenderer.on("gpus", function(e,d) {
  if (d == "ok") {
    updateGPUs();
  }
})

var selected = [];
updateGPUs();

$(".list-group-item").click(function() {
  $(this).toggleClass("active");
  var idx = $.inArray($(this).attr('id'), selected);
  if (idx == -1) {
    selected.push($(this).attr('id'));
  } else {
    selected.splice(idx, 1);
  }
  if (selected.length > 0) {
    $("#benchmark").removeClass("disabled");
  } else if (!$("#benchmark").hasClass("disabled")){
    $("#benchmark").addClass("disabled")
  }
})

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

$("#benchmark").click(function() {
  if ($(this).hasClass("disabled")) {
    return false;
  }
  $(".loadpopup").removeClass("hidden");

  // First, check miners are here and if not, download
  $("#action").text("Downloading miners...");
  var miners = store.get("config").miners;
  var increment = 1/miners.length;
  var barval = 0;
  var doneMiner = 0;
  var promises = [];
  for(var idx in miners) {
    var miner = miners[idx];
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

$("#cancel_bench").click(function() {
  cancelBenchmark = true;
  $(".loadpopup").addClass("hidden");
  //bar.animate(0, function() {}); // cool but for later
})

function updateGPUs() {
  var gpus = store.get('gpus');
  if(gpus !== undefined && gpus.length > 0) {
    $("#gpuList").html("");
  }
  for (var id in gpus) {
    var dis = 'disabled';
    if (typeof store.get('bench') !== 'undefined' && typeof store.get('bench')[id] !== 'undefined') {
      dis = ""
    }
    $("#gpuList").append("<a href='#' class='list-group-item list-group-item-action' id='gpuid_"+id+"'>"+gpus[id]+"<span class='pull-right'><button class='btn btn-xs secondary "+dis+"'>Stats</button></span></a>")
  }
}

// Actual benchmark happens here...
function benchmark() {
  $("#action").text("Benchmarking...");

  // First some checks. Pool(s) and address defined?
  var wallet = store.get("wallet");
  if (wallet === undefined) {
    $("#error").html("Please set a wallet address to start.");
    $("#action").text("Error");
    return false;
  }
  var pools = store.get("selectedPools");
  if (pools === undefined || pools.length == 0) {
    $("#error").html("Please select at least one pool to start.");
    $("#action").text("Error");
    return false;
  }

  var miners = store.get("config").miners;
  for(var midx in miners) {
    if(cancelBenchmark) {
      return false;
    }
    var miner = miners[midx];
    for (var pidx in pools) {
      var pool = pools[pidx];
      // TODO: fetch pool data
      child_process.execFile(binPath+miner.folder+miner.name+".exe", ["-a", "x17","-o","stratum+tcp://x17."+pool.mine_URL+":3737", "-u", wallet, "-p", "Hasher"], function(error, stdout, stderr){
      	console.log("error"+error);
        console.log("out"+stdout);
        console.log("err"+stderr);
      });
    }
  }
}
