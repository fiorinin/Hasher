var electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path')
const url = require('url')

require('electron-debug')({showDevTools: false});
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({width: 600, height: 400, resizable: false})
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

  const {ipcMain} = require('electron')
  ipcMain.on('changePage', (event, arg) => {
    loadPage(arg)
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function loadPage(pageName) {
  page = "index"
  if(pageName != "")
    page = pageName
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'template/'+page+'.html'),
    protocol: 'file:',
    slashes: true
  }))
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
