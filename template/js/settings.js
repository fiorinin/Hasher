const {ipcRenderer} = require('electron');
const Store = require('electron-store');
const store = new Store();

// Open links in browser
const shell = require('electron').shell;
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

$("#version").text("Hasher v"+store.get("version"))

$("#back").click(function() {
  ipcRenderer.send('changePage', "")
})
