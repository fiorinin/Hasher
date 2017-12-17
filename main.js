var electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path')
const url = require('url')

require('electron-debug')({showDevTools: true});
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({width: 1400, height: 700})
  mainWindow.setMenu(null)
  var pjson = require('./package.json');

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'template/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('version', pjson.version)
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
