const Store = require('electron-store');
const store = new Store();

function percentsToMinutes(p) {
  p /= 100;
  return Math.round(((p*1440) * 100) / 100);
}

function minutesToPercents(m) {
  return Math.round((m*10000)/1400)/100;
}

don = store.get("donation");
if (don !== undefined) {
  $("#percent").val(don*100);
  $("#minute").val(percentsToMinutes(don*100));
}

$("#percent").keyup(function() {
  var val = $(this).val();
  $("#minute").val(percentsToMinutes(val));
})

$("#minute").keyup(function() {
  var val = $(this).val();
  $("#percent").val(minutesToPercents(val));
})

$("#save_donation").click(function() {
  donation = $("#percent").val()/100;
  $("#message").addClass("text-alert");
  if (donation < 0) {
    $("#message").text("Error: donation cannot be lower than 0%");
  } else if (donation > 1) {
    $("#message").text("Error: donation cannot be higher than 100%");
  } else {
    $("#message").removeClass("text-alert");
    $("#message").addClass("text-primary");
    store.set("donation", donation);
    if(donation == 0) {
      $("#message").text("Donation is now set to 0%.");
    } else {
      $("#message").html("♥ Thank you so much for your support! ♥<br/>Donation is now set to "+donation*100+"%");
    }
  }
})
