var electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path')
const url = require('url')
const Store = require('electron-store');
const store = new Store();
const GPU = require("./controls/gpu.js");
const gpu = new GPU();

let mainWindow
require('electron-debug')({showDevTools: false});

// GUI ///////
function createWindow () {
  gpu.detect().then(function(gpus){
    store.set("gpus", gpus)
  })
  mainWindow = new BrowserWindow({width: 600, height: 400, resizable: false});
  mainWindow.setMenu(null);

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './template/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // ipc example
  // mainWindow.webContents.on('did-finish-load', () => {
  //   mainWindow.webContents.send('version', pjson.version);
  // })

  const {ipcMain} = require('electron')
  ipcMain.on('changePage', (event, arg) => {
    loadPage(arg)
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function loadPage(pageName) {
  page = "index";
  if(pageName != "") {
    page = pageName;
  }
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './template/'+page+'.html'),
    protocol: 'file:',
    slashes: true
  }))
}
////////////

// Settings initialization //
var pjson = require('./package.json');
store.set("version", pjson.version)
if (typeof store.get('donation') === 'undefined') {
  store.set("donation", 0.01)
}
if (typeof store.get('balance') === 'undefined') {
  store.set("balance", 0)
}
////////////

// App /////
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
///////////
