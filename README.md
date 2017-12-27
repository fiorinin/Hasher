# Hasher
A simple GUI integrating multiple miners for a simple and effective mining experience.

# Appdata path
If you want to remove data installed by this app, please clear ```C:\Users\<USER>\AppData\Roaming\Hasher```.

## Dev setup
```
git clone https://github.com/Johy/Hasher.git
cd Hasher
npm install
npm start
```

## Dev pull
```
git pull
npm install
npm start
```

## Features
* Easy introduction and setup
* Nice interface, more user-friendly than .bat files
* Checks BTC address
* Multipool supported
* Profit calculation works even when APIs are having troubles (retry, caching, and html parsing)
* Single window with all needed information at hand
* Automatic update checks

### Notes to self
CUDA 9 binaries require a nvidia driver 384.xx or more recent
7zip needed
Throttle might needed to be added to DL miners (or maybe have feedback from slow internet users)
Tested with 1x 1080Ti, tests welcome to improve app...
Windows only so far (plans to integrate UNIX)
Expect errors! Feedback highly helpful, as well as user tests: multiple GPU? AMD? Windows other than 10? Pools? etc.
Prioritize pools?
