const {ipcRenderer} = require('electron');
const Store = require('electron-store');
const store = new Store();

$("#version").text("Hasher v"+store.get("version"))

$("#back").click(function() {
  ipcRenderer.send('changePage', "")
})
