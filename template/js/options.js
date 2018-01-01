const Store = require('electron-store');
const store = new Store();
var WAValidator = require('wallet-address-validator');
var config = store.get("config");

var miners = config.miners;
var intensities = store.get("intensities");

wal = store.get("wallet");
if (wal !== undefined) {
  $("#wallet_address").val(wal);
}

$("#save_wallet").click(function() {
  $("#message").removeClass("text-primary");
  $("#message").removeClass("text-alert");
  var wal = $("#wallet_address").val();
  var valid = WAValidator.validate(wal);
  if (valid) {
    $("#message").addClass("text-primary");
    store.set("wallet", $("#wallet_address").val());
    $("#message").text("Wallet address saved!");
  } else {
    $("#message").addClass("text-alert");
    $("#message").text("Error: the address is not a BTC address or is incomplete.");
  }
})

// Can be optimized, but later...
var hardware = store.get("hardware");
if (hardware !== undefined) {
  $(`#${hardware}`).prop("checked", true);
}
$("#nvidia").change(function() {
  if($(this).is(":checked")) {
    hardware = "nvidia";
    store.set("hardware", hardware);
  }
  reloadSpeeds();
  reloadAlgos();
})

$("#amd").change(function() {
  if($(this).is(":checked")) {
    hardware = "amd";
    store.set("hardware", hardware);
  }
  reloadSpeeds();
  reloadAlgos();
});

var benchtime = store.get("benchtime");
if(benchtime < 120000) {
  $("#fast").prop("checked", true);
} else if (benchtime > 120000) {
  $("#slow").prop("checked", true);
} else {
  $("#regular").prop("checked", true);
}

$("#fast").change(function() {
  if($(this).is(":checked"))
    store.set("benchtime", config.speed["fast"])
})

$("#regular").change(function() {
  if($(this).is(":checked"))
    store.set("benchtime", config.speed["regular"])
})

$("#slow").change(function() {
  if($(this).is(":checked"))
    store.set("benchtime", config.speed["slow"])
})

function reloadSpeeds() {
  $(".speed").each(function() {
    var speed = $(this).parent().parent().prev().attr("id");
    var nbalgos = 0;
    if(hardware !== undefined) {
      for(var midx in miners) {
        var miner = miners[midx];
        if (miner.hardware == hardware) {
          nbalgos += miners[midx].algos.length;
        }
      }
      $(this).text(" ("+Math.round(nbalgos*(config.speed[speed]/60000))+"mins)");
    }
  })
}
reloadSpeeds();

// Advanced options
$("#advanced").click(function() {
  $(".advanced").removeClass("hidden");
})
$(".closeAdvanced").click(function() {
  $(".intensity_val").each(function() {
    var algo = $(this).attr("id");
    intensities[algo] = $(this).val();
  });
  if(intensities !== undefined) {
    store.set("intensities", intensities);
  }
  $(".advanced").addClass("hidden");
})

if(hardware !== undefined) {
  reloadAlgos();
}

function reloadAlgos() {
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
  $(".intensity").html("");
  if (intensities === undefined) {
    intensities = {};
  }
  for(var i = 0; i < listedAlgos.length; i++) {
    var algo = listedAlgos[i];
    var row = $(`<div class="row">`);
    if(intensities[algo] === undefined) {
      intensities[algo] = "";
    }
    var val = intensities[algo];
    var input = `<div class="col-xs-6"><div class="input-group input-group-xs">
                  <span class="input-group-addon" id="basic-addon1">${algo}</span>
                  <input type="text" id="${algo}" class="intensity_val form-control" aria-describedby="basic-addon1" value="${val}">
                </div></div>`;
    if(i % 2 == 0) {
      row.append(input);
      $(".intensity").append(row);
    } else {
      $(".intensity .row:last-child").append(input);
    }
  }
  store.set("intensities", intensities);
}

// Intro section
if(store.get("intro") == false) {
  $("#back").hide();
} else{
  $("#next").hide();
}

$("#next").click(function() {
  $("#intro_errors").html("");
  var err = false;
  if(store.get("wallet") === undefined) {
    $("#intro_errors").append("You need to enter and save your BTC address.<br>");
    err = true;
  }
  if(store.get("hardware") === undefined) {
    $("#intro_errors").append("You need to select your hardware.<br>");
    err = true;
  }
  if(!err) {
    const {ipcRenderer} = require('electron');
    ipcRenderer.send('changePage', "pool");
  }
});
