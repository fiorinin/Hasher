const {ipcRenderer} = require('electron')

$("#back").click(function() {
  ipcRenderer.send('changePage', "")
})
