import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import {deployContract} from "./utils/setup";
import {erc721Contract} from "./utils/testTokens";

describe("Wrap erc721", async () => {

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

    it('should ask for wrap', async () => {
        const { multisig, erc721Token } = await deployMultisig();
        const source = accounts[6];
        await erc721Token.mint(source.address, 1337);
        await erc721Token.connect(source).setApprovalForAll(multisig.address, true);

        await expect(multisig.connect(source).wrapERC721(erc721Token.address, 1337, "1234"))
            .to.emit(multisig, 'ERC721WrapAsked')
            .withArgs(source.address, erc721Token.address, 1337, "1234");
        expect(await erc721Token.balanceOf(multisig.address)).to.equal(1);
        expect(await erc721Token.ownerOf(1337)).to.equal(multisig.address);
    });

    it('Should fail if not approved', async () => {
        const { multisig, erc721Token } = await deployMultisig();
        const source = accounts[6];
        await erc721Token.mint(source.address, 1337);

        await expect(multisig.connect(source).wrapERC721(erc721Token.address, 1337,"1234"))
            .to.be.revertedWith("WRAP: ERC721_TRANSFER_FAILED");
    });
})