var config = require("./config");
const {app, BrowserWindow, ipcMain} = require('electron');
const {autoUpdater} = require("electron-updater");
const path = require('path')
const url = require('url')
const Store = require('electron-store');
const store = new Store();
const GPU = require("./controls/gpu.js");
const gpu = new GPU();
const utilities = require("./controls/utilities.js");
const log = require('electron-log');
log.transports.file.level = "info";

let mainWindow;
require('electron-debug')({showDevTools: config.debug});

if(config.debug) {
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';
}

log.info('App starting...')

// GUI ///////
function createWindow () {
  gpu.detect().then(function(gpus){
    store.set("gpus", gpus);
    mainWindow.webContents.send('gpus', "ok");
  })
  mainWindow = new BrowserWindow({width: 600, height: 470, resizable: config.debug});
  mainWindow.setMenu(null);

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './template/index.html'),
    protocol: 'file:',
    slashes: true
  }))

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
if (typeof store.get('intro') === 'undefined') {
  store.set("intro", false);
}
if (typeof store.get('donation') === 'undefined') {
  store.set("donation", 0.01);
}
if (typeof store.get('balance') === 'undefined') {
  store.set("balance", 0);
}
if (typeof store.get('selectedPools') === 'undefined') {
  store.set("selectedPools", []);
}
if (typeof store.get('benchtime') === 'undefined') {
  store.set("benchtime", 120000);
}
if (typeof store.get('gpus_to_use') === 'undefined') {
  store.set("gpus_to_use", []);
}
if (typeof store.get('benched') === 'undefined') {
  store.set("benched", {});
}
if (typeof store.get('enabled_algos') === 'undefined') {
  store.set("enabled_algos", {});
}
if (typeof store.get('estimate') === 'undefined') {
  store.set("estimate", "24h_actual");
}
if (typeof store.get('profitCheckFreq') === 'undefined') {
  store.set("profitCheckFreq", 10);
}
if (typeof store.get('smoothing') === 'undefined') {
  store.set("smoothing", 5);
}
if (typeof store.get('langPools') === 'undefined') {
  var langPools = [];
  for(var idx in config.pools) {
    pregions = [];
    if(config.pools[idx].regions !== undefined) {
      for (var ridx in config.pools[idx].regions) {
        pregions.push(false);
      }
      pregions[0] = true;
    }
    langPools.push(pregions);
  }
  store.set("langPools", langPools);
}
// Force Nvidia for now
if (typeof store.get('hardware') === 'undefined') {
  store.set("hardware", "nvidia");
}
store.set("config", config);
////////////

// App /////
app.on('ready', function(){
  autoUpdater.checkForUpdatesAndNotify();
  createWindow();
});

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
