const {ipcRenderer} = require('electron')
const Store = require('electron-store');
const store = new Store();

$("#version").text("Hasher v"+store.get("version"))
$(".menu").click(function() {
  ipcRenderer.send('changePage', $(this).attr('id'))
})
