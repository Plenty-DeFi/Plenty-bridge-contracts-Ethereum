import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";

task("deploy-contract", "Deploys and verifies contracts")
    .setAction(async (_, hre) => {
        await hre.run("deploy")
        await hre.run("local-verify")
        await hre.run("etherscan-verify")
    });

export { }