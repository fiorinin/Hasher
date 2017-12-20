const exec = require('child_process').exec;
const platform = require('os').platform();

module.exports = class GPU {
  constructor() {}

  detect() {
      return new Promise(function(resolve, reject) {
          function getWindowsInfo() {
              exec('wmic path win32_VideoController get name', (error, stdout, stderr) => {
                  if (error) {
                      console.error(` - exec error: ${error}`);
                      return reject(error);
                  }
                  resolve(stdout.match(/[^\r\n]+/g).splice(1));
              });
          }

          function getLinuxInfo() {
              // TODO. Not tested yet.
              exec('sudo lshw -C display', (error, stdout, stderr) => {
                  if (error) {
                      console.error(` - exec error: ${error}`);
                      return reject(error);
                  }
                  resolve(stdout.match(/[^\r\n]+/g).splice(1));
              });
          }

          function getMacInfo() {
              // Tested but clunky, not sure mining on OSX is a thing, anyway...
              // Currently detects only one GPU
              exec('system_profiler | grep -A2 Graphics/Displays', (error, stdout, stderr) => {
                  if (error) {
                      console.error(` - exec error: ${error}`);
                      return reject(error);
                  }
                  var out = stdout.split("\n");
                  resolve([out[out.length-2].trim().replace(":", "")]);
              });
          }

          switch (platform) {
              case 'win32':
                  getWindowsInfo();
                  break;
              case 'linux':
                  getLinuxInfo();
                  break;
              case 'darwin':
                  getMacInfo();
                  break;
              default:
                  return reject(new Error('platform unsupported'));
          }
      });
  }
}
