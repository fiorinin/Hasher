# Hasher
A simple yet comprehensive interface that benchmarks your hardware, downloads and run miners for you to effectively mine the most profitable coin on the most profitable pool.

###### Licence GNU GPL v3.0: permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.

## Features
* Easy introduction and setup
* Nice interface, more user-friendly than command files
* Single window with all information at hand (hashrate, algo, pool, profit estimates and balances)
* Multipool supported: zpool, aHashProol, HashRefinery and NiceHash - Hasher will mine on the most profitable pool
* Benchmarking and miner comparison to pick the best one for each algo
* More customization options (e.g., intensity) while still keeping it simple
* Robust profit calculation - i.e. even when pool APIs are having troubles
* Automatic update checks
* BTC address validation in setup
* It's free! There is a default donation of 1% - 14mins a day - that you can void (or increase..!)

*This is a free project I developed for myself out of entertainment, new technology enthusiasm and personal needs. While I plan to improve this project, I greatly appreciate bitcoin donations to support the project: **14t4EkREaQfsbwngtLS7KJx7d1ADiWuB9c***

Before creating Hasher, I used [NemosMiner](https://github.com/nemosminer/NemosMiner-v2.3) and [MultiPoolMiner](https://github.com/MultiPoolMiner/MultiPoolMiner). I got the inspiration for Hasher from them and wanted additional features as above. Therefore, I'd like to thank them, and you can too by donating bitcoin:  
NemosMiner: 1QGADhdMRpp9Pk5u5zG1TrHKRrdK5R81TE  
MultiPoolMiner: 1MsrCoAt8qM53HUMsUxvy9gMj3QVbHLazH*


## Installation
1. Download the latest version at https://github.com/Johy/Hasher/releases
2. Put it some place convenient for you like your documents or desktop
3. Hasher has a few dependencies (listed below) that you need to make sure to have
4. Double-click on the application
5. Follow the introductory setup, and enjoy!

## Dependencies
* CUDA 9 binaries require Nvidia drivers 384.xx or more recent
* ccminer (Nvidia) may need [MSVCR120.dll](https://www.microsoft.com/en-gb/download/details.aspx?id=40784)
* ccminer (Nvidia) may need [VCRUNTIME140.DLL](https://www.microsoft.com/en-us/download/details.aspx?id=48145)
* If you have multiple GPUs, it is recommended to set Virtual Memory size in Windows to at least 16 GB. To this end, go to Computer Properties -> Advanced System Settings -> Performance -> Advanced -> Virtual Memory

## Known issues
* Hasher is still extremely recent, so do not expect complete stability over 1 month without rebooting, for example (although it might just work!). Bugs are to be expected but at this point, I need actual users to report them so that I can fix them. Note that Hasher does nothing else than running miners. It's not overclocking your hardware or anything.
* Following on this, I am not an AMD user, therefore I can't test anything related to AMD cards. I'd be very happy if some people reported their experience with AMD but in the meantime, consider AMD will be less stable. And CPU is not implemented either but it might integrate it if there's demand.
* I am working on a logging system so that users can better share their issues if any. This will help me to be more responsive to fix these issues.

## Frequently Asked Questions
###### Mining doesn't work, what should I do?
A lot of things could have gone wrong. You could be trying to run Nvidia miners on AMD hardware, picked only algorithms that the pool(s) you selected don't support, etc. I am currently working on integrating logging, so that you will be able to share what Hasher has to say about your issues. In the meantime, you can [report an issue](https://github.com/Johy/Hasher/issues) by being as comprehensive as you can and explaining how to reproduce the error. If some specific algorithms don't work, try reducing their intensity in the advanced settings, or simply deselect them for Hasher to stop trying to mine with it.

###### How long does benchmarking take? Can I speed it up?
This depends heavily on you, actually. Benchmarking is simple: Hasher runs algorithms (you pick) on compatible pools (you selected) for a given amount of time (that you set) and stores the average hashrate(s) reported by the miner(s). You can choose among 3 benchmarking speeds (30s, 2mins or 3mins), and longer benchmarks will be more robust for estimating profits. Feel free to adapt your strategy to fit your needs by (de)selecting algorithms, changing speed, etc. Note that all mining done while benchmarking is credited to your wallet in the respective pool(s).

###### My balance is different from the pool value, why?
The balance displayed is **shared across all selected pools**. If you are using a single pool and the value is different, there is likely a network error (check for the warning symbol in the balance box) and Hasher could not update this value. The pool website will always display the correct value.

###### Where are Hasher's files stored?
Apart from the executable you download, Hasher uses the following path to download miners, store your settings, caches, etc.: ```C:\Users\<USER>\AppData\Roaming\Hasher```. Feel free to have a look and delete it if you plan not to use Hasher anymore. Note that removing this folder will delete all your settings and you will have to go through the introduction again and benchmark your hardware if you want to use Hasher again.

###### I want to contribute!
Amazing, thank you really! You are welcome to browse, download and improve the code as you wish. It's still messy so far but as soon as I get all the features I want, I'll clean it up deeply. To run the code, you should have Node.js (esp., the npm command). Then, you can run these commands to download, install and start a local version of the source code:
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
