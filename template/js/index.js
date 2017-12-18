const {ipcRenderer} = require('electron')

var version = ""
ipcRenderer.on('version', (event, message) => {
  $("#version").text("Hasher v"+message)
})

$(".menu").click(function() {
  ipcRenderer.send('changePage', $(this).attr('id'))
})
