import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import {task, types} from "hardhat/config";
import abi from "../../WrapMultisig.abi.json";
import {arrayify, parseEther} from "ethers/lib/utils";
import {ethers} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const erc20ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DECIMALS","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"value","type":"uint256"}],"name":"burnFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"}],"name":"addMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"isMinter","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"}],"name":"MinterAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"}],"name":"MinterRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}];
const erc721ABI = [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];
const tezosDestinationAddress = "tz1exrEuATYhFmVSXhkCkkFzY72T75hpsthj";
const ifaceErc20 = new ethers.utils.Interface([
    "function transfer(address to, uint amount)"
]);
const ifaceErc721 = new ethers.utils.Interface([
    "function safeTransferFrom(address from, address to, uint256 tokenId)"
]);

task("approve-erc20", "Approve erc20 spending")
    .addParam("contract", "Multisig contract address", undefined, types.string, false)
    .addParam("erc20contract", "ERC20 contract address", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const signers = await ethers.getSigners();
        const contractAddress = taskArgs.contract;
        const erc20Address = taskArgs.erc20contract;
        const account = signers[0];
        const contract = new ethers.Contract(erc20Address, erc20ABI, account);
        await contract
            .approve(contractAddress, parseEther("100"));
        console.log(`New allowance set for ${contractAddress} for account ${account.address}`)
    });

task("wrap-erc20", "Wrap erc20")
    .addParam("contract", "Multisig contract address", undefined, types.string, false)
    .addParam("erc20contract", "ERC20 contract address", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const signers = await ethers.getSigners();
        const contractAddress = taskArgs.contract;
        const erc20Address = taskArgs.erc20contract;
        const account = signers[0];
        const contract = new ethers.Contract(contractAddress, abi, account);
        await contract.wrapERC20(erc20Address, parseEther("0.1"), tezosDestinationAddress);
        console.log(`ERC20 wrapped to ${tezosDestinationAddress}`)
    });

task("wrap-erc721", "Wrap erc721")
    .addParam("contract", "Multisig contract address", undefined, types.string, false)
    .addParam("erc721contract", "ERC721 contract address", undefined, types.string, false)
    .addParam("erc721tokenid", "ERC721 token id", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const signers = await ethers.getSigners();
        const contractAddress = taskArgs.contract;
        const erc721Address = taskArgs.erc721contract;
        const erc721TokenId = taskArgs.erc721tokenid;
        const account = signers[0];
        const multisigContract = new ethers.Contract(contractAddress, abi, account);
        const erc721Contract = new ethers.Contract(erc721Address, erc721ABI, account);
        await erc721Contract.mint(account.address, erc721TokenId, { gasLimit: 400000 });
        await erc721Contract.setApprovalForAll(contractAddress, true);
        await multisigContract.wrapERC721(erc721Address, erc721TokenId, tezosDestinationAddress, { gasLimit: 400000 });
        console.log(`ERC721 wrapped to ${tezosDestinationAddress}`)
    });

const signer = async function (multisig: ethers.Contract, confirmingAccounts: SignerWithAddress[], to: string, value: number, data: string, tezosTransaction: string) {
    const txHash = arrayify(await multisig.getTransactionHash(to, value, data, tezosTransaction));
    let signatureBytes = "0x"
    confirmingAccounts.sort((a,b) => {
        if(a.address < b.address) { return -1; }
        if(a.address > b.address) { return 1; }
        return 0;
    });
    for (let i = 0; i < confirmingAccounts.length; i++) {
        const signature = await confirmingAccounts[i].signMessage(txHash);
        signatureBytes += signature.replace('0x', '').replace(/00$/, "1b").replace(/01$/, "1c");
    }
    return signatureBytes
}

task("unwrap-erc20", "Wrap erc20")
    .addParam("contract", "Multisig contract address", undefined, types.string, false)
    .addParam("erc20contract", "ERC20 contract address", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const signers = await ethers.getSigners();
        const contractAddress = taskArgs.contract;
        const erc20Address = taskArgs.erc20contract;
        const multisigContract = new ethers.Contract(contractAddress, abi, signers[0]);
        const currentSigners = [signers[0], signers[2]];
        const destination = signers[4].address;
        const tezosTransaction = "0x123456";
        const data = ifaceErc20.encodeFunctionData("transfer", [destination, 10]);
        const signatures = await signer(multisigContract, currentSigners, erc20Address, 0, data, tezosTransaction);

        await multisigContract.execTransaction(erc20Address, 0, data, tezosTransaction, signatures);

        console.log(`ERC20 unwrapped to ${destination}`)
    });

task("unwrap-erc721", "Wrap erc721")
    .addParam("contract", "Multisig contract address", undefined, types.string, false)
    .addParam("erc721contract", "ERC721 contract address", undefined, types.string, false)
    .addParam("erc721tokenid", "ERC721 token id", undefined, types.string, false)
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre;
        const signers = await ethers.getSigners();
        const contractAddress = taskArgs.contract;
        const erc721Address = taskArgs.erc721contract;
        const erc721TokenId = taskArgs.erc721tokenid;
        const multisigContract = new ethers.Contract(contractAddress, abi, signers[0]);
        const currentSigners = [signers[0], signers[2]];
        const destination = signers[4].address;
        const tezosTransaction = "0x12345678";
        const data = ifaceErc721.encodeFunctionData("safeTransferFrom", [contractAddress, destination, erc721TokenId]);
        const signatures = await signer(multisigContract, currentSigners, erc721Address, 0, data, tezosTransaction);

        await multisigContract.execTransaction(erc721Address, 0, data, tezosTransaction, signatures, { gasLimit: 400000 });

        console.log(`ERC721 unwrapped to ${destination}`)
    });

export { }