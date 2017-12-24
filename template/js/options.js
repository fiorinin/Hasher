const Store = require('electron-store');
const store = new Store();
var WAValidator = require('wallet-address-validator');
var config = store.get("config");

wal = store.get("wallet");
if (wal !== undefined) {
  $("#wallet_address").val(wal);
}

$("#save_wallet").click(function() {
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

$("#nvidia").change(function() {
  if($(this).is(":checked"))
    store.set("hardware", "nvidia");
  // TODO: update estimates for benchmark
})

$("#amd").change(function() {
  if($(this).is(":checked"))
    store.set("hardware", "amd");
  // TODO: update estimates for benchmark
})

var hardware = store.get("hardware");
if (hardware !== undefined) {
  $(`#${hardware}`).prop("checked", true);
}

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
    store.set("benchtime", 60000)
})

$("#regular").change(function() {
  if($(this).is(":checked"))
    store.set("benchtime", 120000)
})

$("#slow").change(function() {
  if($(this).is(":checked"))
    store.set("benchtime", 180000)
})

$(".speed").each(function() {
  var speed = $(this).parent().parent().prev().attr("id");
  var nbalgos = 0;
  var miners = config.miners;
  for(var midx in miners) { nbalgos += miners[midx].algos.length; }
  if(speed == "slow") {
    $(this).text(" (~"+nbalgos*3+"mins)");
  }
  if(speed == "regular") {
    $(this).text(" (~"+nbalgos*2+"mins)");
  }
  if(speed == "fast") {
    $(this).text(" (~"+nbalgos+"mins)");
  }
})
