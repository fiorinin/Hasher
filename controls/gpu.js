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
            // Not tested yet
              exec('sudo lshw -C display', (error, stdout, stderr) => {
                  if (error) {
                      console.error(` - exec error: ${error}`);
                      return reject(error);
                  }
                  resolve(stdout.match(/[^\r\n]+/g).splice(1));
              });
          }

          function getMacInfo() {
            // Not tested yet
              exec('system_profiler | grep GeForce', (error, stdout, stderr) => {
                  if (error) {
                      console.error(` - exec error: ${error}`);
                      return reject(error);
                  }
                  resolve(stdout.match(/[^\r\n]+/g).splice(1));
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
