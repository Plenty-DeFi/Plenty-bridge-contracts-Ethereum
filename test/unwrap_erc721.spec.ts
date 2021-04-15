import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import {deployContract} from "./utils/setup";
import {erc20Contract, erc721Contract} from "./utils/testTokens";
import {ethers} from "ethers";

describe("Unwrap erc721", async () => {

    const accounts = waffle.provider.getWallets();

    const deployMultisig = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const multisigDeployment = await deployments.get("WrapMultisig");
        const multisig = await hre.ethers.getContractFactory("WrapMultisig");
        const contract = multisig.attach(multisigDeployment.address);
        const multisigAdmin = contract.connect(accounts[4]);
        await multisigAdmin.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const erc721Token = await deployContract(accounts[0], erc721Contract);
        return {
            multisig: multisigAdmin,
            erc721Token
        };
    })

    const signer = async function (multisig: ethers.Contract, confirmingAccounts: string[], to: string, value: number, data: string, tezosTransaction: string) {
        let txHash = await multisig.getTransactionHash(to, value, data, tezosTransaction);
        let signatureBytes = "0x"
        confirmingAccounts.sort();
        for (let i = 0; i < confirmingAccounts.length; i++) {
            const signature = await waffle.provider.send("eth_sign", [confirmingAccounts[i], txHash]);
            signatureBytes += signature.replace('0x', '').replace(/00$/, "1b").replace(/01$/, "1c");
        }
        return signatureBytes
    }

    const iface = new ethers.utils.Interface([
        "function safeTransferFrom(address from, address to, uint256 tokenId)"
    ]);

    it('Should withdraw ERC20 with 2 signers', async () => {
        const { multisig, erc721Token } = await deployMultisig();
        await erc721Token.mint(multisig.address, 1337);
        let signers = [accounts[0].address, accounts[2].address]
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        let data = iface.encodeFunctionData("safeTransferFrom", [multisig.address, destination, 1337]);
        const signatures = await signer(multisig, signers, erc721Token.address, 0, data, "0x1234");

        await expect(multisig.execTransaction(erc721Token.address, 0, data, "0x1234", signatures))
            .to.emit(multisig, 'ExecutionSuccess');
        expect(await erc721Token.ownerOf(1337)).to.equal(destination);
        expect(await erc721Token.balanceOf(multisig.address)).to.equal(0);
    });
})