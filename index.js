import { ethers } from "ethers";
import cliProgress from "cli-progress"
import fastcsv from "fast-csv"
import { createWriteStream } from 'fs'
import masterchefAbi from './masterchef.json'
import farms from './farms.js'

const simpleRpcProvider = new ethers.providers.StaticJsonRpcProvider("https://nodes.pancakeswap.com")
const MASTERCHEF_ADDRESS = "0x73feaa1eE314F8c655E354234017bE2193C9E24E"
const MASTERCHEF_CONTRACT = new ethers.Contract(MASTERCHEF_ADDRESS, masterchefAbi, simpleRpcProvider)

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const fetchFarmData = async () => {
    console.log(`\n\n 🐰🧑‍🌾🚜 Fetching PancakeSwap farm data`)
    console.log('-'.repeat(process.stdout.columns))
    progressBar.start(farms.length, 0);
    for (const farm of farms) {
        const poolInfo = await MASTERCHEF_CONTRACT.poolInfo(farm.pid)
        const multiplier = poolInfo.allocPoint.div(100).toNumber()
        farm.multiplier = multiplier
        progressBar.increment();
    }
    progressBar.stop();
    const formattedData = farms.map((farm) => ({ pid: farm.pid, name: `${farm.token.symbol}-${farm.quoteToken.symbol}`, multiplier: farm.multiplier}))
    const filename = `PCS_FARMS_${new Date().getDate()}-${new Date().getMonth()}-${new Date().getFullYear()}--${new Date().getHours()}-${new Date().getMinutes()}-${new Date().getSeconds()}.csv`
    const ws = createWriteStream(filename);
    fastcsv
        .write(formattedData, { headers: true })
        .on("finish", function() {
            console.log(`Farm data saved to ${filename}`);
        })
        .pipe(ws);
    // console.table(formattedData)
    // const totalAllocPoint = await MASTERCHEF_CONTRACT.totalAllocPoint()
    // console.log("totalAllocPoint", totalAllocPoint.toString())
}

fetchFarmData()
