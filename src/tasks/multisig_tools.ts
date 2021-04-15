import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import {task, types} from "hardhat/config";
import abi from "../../WrapMultisig.abi.json";

task("multisig-setup", "Setup multisig contract")
    .addParam("contract", "Contract address", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { getNamedAccounts, ethers } = hre;
        const signers = await ethers.getSigners();
        const { deployer, account1, account2 } = await getNamedAccounts();
        const contractAddress = taskArgs.contract;
        if (!contractAddress) {
            throw new Error("Missing contract address");
        }
        const contract = new ethers.Contract(contractAddress, abi, signers[3]);
        const owners = [deployer, account1, account2];
        const threshold = 2;
        await contract
            .setup(owners, threshold);
        console.log(`Multisig setup with owners ${owners} and threshold ${threshold}`)
    });

task("multisig-add-owner", "Add owner to multisig")
    .addParam("contract", "Contract address", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { getNamedAccounts, ethers } = hre;
        const signers = await ethers.getSigners();
        const { account5 } = await getNamedAccounts();
        const contractAddress = taskArgs.contract;
        if (!contractAddress) {
            throw new Error("Missing contract address");
        }
        const contract = new ethers.Contract(contractAddress, abi, signers[3]);
        const newOwner = account5;
        const threshold = 2;
        await contract
            .addOwnerWithThreshold(account5, threshold);
        console.log(`Multisig new owner ${newOwner}, threshold ${threshold}`)
    });

task("multisig-show-info", "Show info of a multisig")
    .addParam("contract", "Contract address", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const signers = await ethers.getSigners();
        const contractAddress = taskArgs.contract;
        if (!contractAddress) {
            throw new Error("Missing contract address");
        }
        const contract = new ethers.Contract(contractAddress, abi, signers[3]);
        const administrator = await contract.getAdministrator();
        const owners = await contract.getOwners();
        const threshold = await contract.getThreshold();
        console.log(`Administrator ${administrator}`);
        console.log(`Owners ${owners}`);
        console.log(`Threshold ${threshold}`);
    });


export { }