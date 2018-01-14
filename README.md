# Hasher
A simple yet comprehensive interface that benchmarks your hardware, downloads and runs miners for you to effectively mine the most profitable coin on the most profitable pool. Nvidia only for now.

###### Licence GNU GPL v3.0: permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.

<div style="text-align:center"><img src="https://raw.githubusercontent.com/Johy/Hasher/master/build/pictures/home.jpg" /></div>

## Features
* Easy introduction and setup
* Nice interface, more user-friendly than command files
* Single window with all information at hand (hashrate, algo, pool, profit estimates and balances)
* Multipool supported: zpool, aHashProol, HashRefinery and NiceHash - Hasher will mine on the most profitable pool
* Benchmarking and miner comparison to pick the best one for each algo
* More customization options (e.g., intensity, smoothing, profit check frequency) while still keeping it simple
* Robust profit calculation - i.e. even when pool APIs are having troubles. The smoothing parameter also prevents switching algorithms/pools too frequently and thus allows building mining speed more effectively
* Automatic updates: when a new version is released, it will be downloaded when you launch Hasher and installed when you quit it. No more time spent to check updates and copying files!
* BTC address validation in setup, you can't enter a wrong address (because of your cat) anymore
* It's free! There is a default donation of 1% - 14mins a day - that you can void (or increase...!)

*This is a free project I developed for myself out of entertainment, new technology enthusiasm and personal needs. While I plan to improve this project, I greatly appreciate bitcoin donations to support the project: **14t4EkREaQfsbwngtLS7KJx7d1ADiWuB9c***

*Before creating Hasher, I used [NemosMiner](https://github.com/nemosminer/NemosMiner-v2.3) and [MultiPoolMiner](https://github.com/MultiPoolMiner/MultiPoolMiner). I got the inspiration for Hasher from them and wanted additional features as above. Therefore, I'd like to thank them, and you can too by donating bitcoin:  
NemosMiner: 1QGADhdMRpp9Pk5u5zG1TrHKRrdK5R81TE  
MultiPoolMiner: 1MsrCoAt8qM53HUMsUxvy9gMj3QVbHLazH*


## Installation
1. Download the [latest `.exe` release](https://github.com/Johy/Hasher/releases/latest)
2. Hasher has a few dependencies (listed below) that you need to make sure to have
4. Double-click on the `.exe` application. A quick install will start, create a shortcut on your Desktop and launch it
5. Follow the introductory setup in Hasher, and enjoy!

<sup><sub>**If you prefer not to use a .exe file for security purposes, which I understand, you can download the zip at the same URL, uncompress it and follow the steps in the FAQ.**</sub></sup>

## Dependencies
* CUDA 9 binaries require Nvidia drivers 384.xx or more recent
* ccminer may need [MSVCR120.dll](https://www.microsoft.com/en-gb/download/details.aspx?id=40784)
* ccminer may need [VCRUNTIME140.DLL](https://www.microsoft.com/en-us/download/details.aspx?id=48145)
* If you have multiple GPUs, it is recommended to set Virtual Memory size in Windows to at least 16 GB. To this end, go to Computer Properties -> Advanced System Settings -> Performance -> Advanced -> Virtual Memory

## Known issues
* Hasher is still extremely recent, so do not expect complete stability over 1 month without rebooting, for example (although it might just work!). Bugs are to be expected but at this point, I need actual users to report them so that I can fix them. My tests of simulated edge cases and longer runs have all passed, which is why I can now release.
* Following on this, I am not an AMD user, therefore **I can't test anything related to AMD cards**. I'd be very happy if some people would be willing to advise me regarding algorithms/settings as I'd like to support AMD but I don't want to release anything that hasn't been tested. CPU is not implemented either but I might integrate it if there's demand.
* I am working on a logging system so that users can better share their issues if any. This will help me to be more responsive to fix them.
* While auto-update is here, Hasher does not yet auto-update miners. I'm working on it as I think it's a critical feature to always be up-to-date in the CC world.

## Frequently Asked Questions
###### What's this naming convention for miners and algorithms?
Since Hasher allows you to use multiple miners on the same algorithm, I used the following naming convention `<algo>-<miner_fork>` for clarity. In the performance tab, you can reorder all pairs by hashrate, profit, etc. So the naming shouldn't bother you much as you can very quickly see which algorithms/miners are the best fit for you. This strategy guarantees that virtually any hardware gets the best hashrate, compared to forcing you to use a given miner for a given algorithm.

###### I experience slowdowns, shutdowns or crashes, what's going on?
Hasher is not really resource hungry, but it _is_ by definition heavier than a `.bat` command. If you experience slowdowns, you might want to minimize the app - it has been effective when the display runs on a mining GPU since it gets rid of animations. Note however that I could not see any impact of Hasher on the mining speed at all (minimized or not), you just might get a better experience using your PC in the meantime if you minimize (close to when you mine with `.bat` files).

###### Mining doesn't work, what should I do?
A lot of things could have gone wrong. You could be trying to run non-benchmarked algorithms, have picked only algorithms that the pool(s) you selected don't support, or that your hardware is not compatible with. I am currently working on integrating logging, so that you will be able to share what Hasher has to say about your issues. In the meantime, you can [report an issue](https://github.com/Johy/Hasher/issues) by being as comprehensive as you can and explaining how to reproduce the error and I will do my best to assist you. If some specific algorithms don't work, try reducing their intensity in the advanced settings (by default they're on auto which for Alexis78 miner crashes my 1070 for instance and I need to set it at 16), or simply deselect them for Hasher to stop trying to mine with it.

###### How long does benchmarking take? Can I speed it up?
This depends heavily on you, actually. Benchmarking is simple: Hasher runs algorithms (you pick) on compatible pools (you selected) for a given amount of time (that you set) and stores the average hashrate(s) reported by the miner(s). You can choose among 3 benchmarking speeds (30s, 2mins or 3mins), and longer benchmarks will be more robust for estimating profits. Feel free to adapt your strategy to fit your needs by (de)selecting algorithms, changing speed, etc. I personally recommend running a quick benchmark first with everything by default, and then fine tune it by adjusting intensities and running longer benchmarks on algorithms that performed well and those that failed - sometimes, a too short benchmark prevents Hasher to get any speed data. Note that all mining done while benchmarking is credited to your wallet in the respective pool(s) you selected.

###### My balance is different from the pool value, why?
The balance displayed is **shared across all selected pools**. If you are using a single pool and the value is different, there is likely a network error (check for the warning symbol in the balance box) and Hasher could not update this value. The pool website will always display the correct value.

###### How is the profit estimated?
For each algorithm-miner pair you have benchmarked, Hasher will search eligible pools among those you have selected. It will compare their potential profit by using their API, and using the `actual_last24h` field. This has proven to be the most reliable estimate, but I do plan to allow users to switch it to `current_estimate` or `estimate_last24h`. Then, Hasher selects the algorithm-miner pair that would yield the maximum profit given the pool estimates.

###### How is the hashrate calculated?
The hashrate is always the one provided by the miner. In `Performance` section, it is the average hashrate for the benchmark period (see above). When you mine, it is the average of the last 5 values reported by the miner.

###### How frequently does Hasher check profit?
By default, every 10mins, but I am planning to add a setting for this so you can pick any value within an interval.

###### What about donations?
By default, 1% of your mining is donated to support Hasher. This represents 14mins of a full day of mining. Donation occurs every 10 hours of mining (i.e. 6mins every 10hrs by default), so you can benchmark, test the app and play around freely. You can increase it (\~wow much love\~), or set it to 0. You can also directly donate at this address: **14t4EkREaQfsbwngtLS7KJx7d1ADiWuB9c**. Donations really help this project, so thank you!

###### Where are Hasher's files stored?
Apart from the executable you download, Hasher uses the following path to download miners, store your settings, caches, etc.: ```C:\Users\<USER>\AppData\Roaming\Hasher```. Feel free to have a look and delete it if you plan not to use Hasher anymore. Note that removing this folder will delete all your settings and you will have to go through the introduction again and benchmark your hardware if you want to use Hasher again.

###### I want to contribute!
Amazing, thank you really! You are welcome to browse, download and improve the code as you wish. It's still messy so far but as soon as I get all the features I want, I'll clean it up deeply. To run the code, you should have [Node.js](https://nodejs.org), then download the latest release, uncompress it and run:
```
cd /path/to/Hasher/
npm install
npm start
```

If you have [Git](https://git-scm.com/), then you can run these commands in a directory of your choice to download, install and start a local version of the source code:
```
git clone https://github.com/Johy/Hasher.git
cd Hasher
npm install
npm start
```

###### Hasher does not include a pool, a miner or an algorithm I want, what should I do?
You can report your requests in the [issues section](https://github.com/Johy/Hasher/issues) of the Hasher repository. I cannot guarantee that I will implement all requests, but if there is a significant need, I'll definitely give it a try. You can also download and improve the code (see above), and submit a pull request if the FAQ didn't help.

<br>
<sub><sup>Disclaimer  
Like with almost everything in mining, use this app at your own risk. While all it does is running miners created by the mining community, almost all of them state you are using them at your own risk, so same goes with Hasher.</sup></sub>
