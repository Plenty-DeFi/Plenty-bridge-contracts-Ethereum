import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import {deployContract} from "./utils/setup";
import {erc20Contract} from "./utils/testTokens";

describe("Wrap erc20", async () => {

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

    it('should ask for wrap', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        const source = accounts[6];
        await erc20Token.transfer(source.address, 100);
        await erc20Token.connect(source).approve(multisig.address, 10);

        await expect(multisig.connect(source).wrapERC20(erc20Token.address, 10, "1234"))
            .to.emit(multisig, 'ERC20WrapAsked')
            .withArgs(source.address, erc20Token.address, 10, "1234");
        expect(await erc20Token.balances(multisig.address)).to.equal(10);
        expect(await erc20Token.balances(source.address)).to.equal(90);
    });

    it('Should fail if 0 wrapped', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        const source = accounts[6];
        await erc20Token.transfer(source.address, 100);
        await erc20Token.connect(source).approve(multisig.address, 10);

        await expect(multisig.connect(source).wrapERC20(erc20Token.address, 0 ,"1234"))
            .to.be.revertedWith("WRAP: INVALID_AMOUNT");
    });

    it('Should fail if not approved', async () => {
        const { multisig, erc20Token } = await deployMultisig();
        const source = accounts[6];
        await erc20Token.transfer(source.address, 100);

        await expect(multisig.connect(source).wrapERC20(erc20Token.address, 10,"1234"))
            .to.be.revertedWith("WRAP: ERC20_TRANSFER_FAILED");
    });
})