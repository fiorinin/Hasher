var version = ""

require('electron').ipcRenderer.on('version', (event, message) => {
  $("#version").text("Hasher v"+message)
})
