import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import {deployContract} from "./utils/setup";
import {erc20Contract} from "./utils/testTokens";
import {ethers} from "ethers";

describe("Unwrap erc20", async () => {

    const accounts = waffle.provider.getWallets();

    const deployMultisig = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const multisigDeployment = await deployments.get("WrapMultisig");
        const multisig = await hre.ethers.getContractFactory("WrapMultisig");
        const contract = multisig.attach(multisigDeployment.address);
        const multisigAdmin = contract.connect(accounts[4]);
        await multisigAdmin.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const erc20Token = await deployContract(accounts[0], erc20Contract);
        return {
            multisig: multisigAdmin,
            erc20Token
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
        "function transfer(address to, uint amount)"
    ]);

    it('Should withdraw ERC20 with 2 signers', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        await erc20Token.transfer(multisig.address, 100);
        let signers = [accounts[0].address, accounts[2].address]
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        let data = iface.encodeFunctionData("transfer", [destination, 10]);
        const signatures = await signer(multisig, signers, erc20Token.address, 0, data, "0x1234");

        await expect(multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures))
            .to.emit(multisig, 'ExecutionSuccess');
        expect(await erc20Token.balances(multisig.address)).to.equal(90);
        expect(await erc20Token.balances(destination)).to.equal(10);
    });

    it('Should withdraw ERC20 with 3 signers', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        await erc20Token.transfer(multisig.address, 100);
        let signers = [accounts[0].address, accounts[1].address, accounts[2].address]
        const destination = "0xA60aea45459B168D833F913D5901AC84D5d554D5";
        const data = iface.encodeFunctionData("transfer", [destination, 10]);
        const signatures = await signer(multisig, signers, erc20Token.address, 0, data, "0x1234");

        await expect(multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures))
            .to.emit(multisig, 'ExecutionSuccess');
        expect(await erc20Token.balances(multisig.address)).to.equal(90);
        expect(await erc20Token.balances(destination)).to.equal(10);
    });

    it('Shouldnt withdraw same tezos transaction twice', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        await erc20Token.transfer(multisig.address, 100);
        let signers = [accounts[0].address, accounts[2].address]
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        const data = iface.encodeFunctionData("transfer", [destination, 10]);
        const signatures = await signer(multisig, signers, erc20Token.address, 0, data, "0x1234");
        await multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures);

        await expect(multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures))
            .to.revertedWith("WRAP: TRANSACTION_ALREADY_PROCESSED");
    });

    it('Shouldnt withdraw on threshold not reached', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        await erc20Token.transfer(multisig.address, 100);
        let signers = [accounts[0].address]
        const destination = "0xF3fAa7E80d6F21fBf667d0bC7F74eEd6594Cb1b3";
        const data = iface.encodeFunctionData("transfer", [destination, 10]);
        const signatures = await signer(multisig, signers, erc20Token.address, 0, data, "0x1234");

        await expect(multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures))
            .to.revertedWith("WRAP: SIGNATURES_DATA_TOO_SHORT");
    });

    it('Shouldnt withdraw more than erc20 total balance', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        await erc20Token.transfer(multisig.address, 100);
        let signers = [accounts[0].address, accounts[2].address];
        const destination = "0x427B055cDDb82e57D03A3a2B00151402cC7b4247";
        const data = iface.encodeFunctionData("transfer", [destination, 110]);
        const signatures = await signer(multisig, signers, erc20Token.address, 0, data, "0x1234");

        await expect(multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures))
            .to.emit(multisig, 'ExecutionFailure');
        expect(await erc20Token.balances(multisig.address)).to.equal(100);
        expect(await erc20Token.balances(destination)).to.equal(0);
    });

    it('Shouldnt withdraw on bad signers', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        await erc20Token.transfer(multisig.address, 100);
        let signers = [accounts[0].address, accounts[3].address];
        const destination = "0x7153E54E8ABbf60Bb8ADaff1f91283Ed49d37a56";
        const data = iface.encodeFunctionData("transfer", [destination, 10]);
        const signatures = await signer(multisig, signers, erc20Token.address, 0, data, "0x1234");

        await expect(multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures))
            .to.revertedWith("WRAP: INVALID_OWNER_PROVIDED");
    });

    it('Should say if tezos transaction already processed', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        await erc20Token.transfer(multisig.address, 100);
        let signers = [accounts[0].address, accounts[2].address]
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        let data = iface.encodeFunctionData("transfer", [destination, 10]);
        const signatures = await signer(multisig, signers, erc20Token.address, 0, data, "0x1234");
        await multisig.execTransaction(erc20Token.address, 0, data, "0x1234", signatures);

        expect(await multisig.isTezosOperationProcessed("0x1234")).to.be.true;
        expect(await multisig.isTezosOperationProcessed("0x123456")).to.be.false;
    });
})