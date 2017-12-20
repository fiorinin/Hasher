const Store = require('electron-store');
const store = new Store();
var WAValidator = require('wallet-address-validator');

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
