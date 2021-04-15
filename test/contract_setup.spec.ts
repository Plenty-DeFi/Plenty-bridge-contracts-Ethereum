import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";

describe("Contract setup", async () => {

    const accounts = waffle.provider.getWallets();

    const deployMultisig = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const multisigDeployment = await deployments.get("WrapMultisig");
        const multisig = await hre.ethers.getContractFactory("WrapMultisig");
        return multisig.attach(multisigDeployment.address);
    })

    it('should setup contract administrator', async () => {
        const multisig = await deployMultisig();

        expect(await multisig.getAdministrator()).to.equal("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65");
    })

    it('shouldnt allow to setup contract if not administrator', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[1]);

        await expect(multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2))
            .to.be.revertedWith("WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
    })

    it('should setup contract owners and threshold', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4]);
        const owners = [accounts[0].address, accounts[1].address, accounts[2].address];
        const threshold = 2;

        await multisig.setup(owners, threshold);

        expect(await multisig.getOwners()).to.deep.equal(owners);
        expect(await multisig.isOwner(accounts[0].address)).to.be.true;
        expect(await multisig.isOwner(accounts[1].address)).to.be.true;
        expect(await multisig.isOwner(accounts[2].address)).to.be.true;
        expect(await multisig.isOwner(accounts[3].address)).to.be.false;
        expect(await multisig.getThreshold()).to.equal(threshold);
    })

    it('should decline to setup contract twice', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4]);
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2))
            .to.be.revertedWith("WRAP: DOMAIN_SEPARATOR_ALREADY_SET");
    })

    it('shouldnt allow threshold bigger than owners length', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4]);

        await expect(multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 4))
            .to.be.revertedWith("WRAP: THRESHOLD_CANNOT_EXCEED_OWNER_COUNT");
    })

    it('shouldnt allow a 0 threshold', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4]);

        await expect(multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 0))
            .to.be.revertedWith("WRAP: THRESHOLD_NEEED_TO_BE_GREETER_THAN_0");
    })

    it('shouldnt allow an invalid owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4]);

        await expect(multisig.setup([accounts[0].address, "0x0000000000000000000000000000000000000000", accounts[2].address], 2))
            .to.be.revertedWith("WRAP: INVALID_OWNER_PROVIDED");
    })

    it('shouldnt allow duplicate owners', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4]);

        await expect(multisig.setup([accounts[0].address, accounts[0].address, accounts[0].address], 1))
            .to.be.revertedWith("WRAP: DUPLICATE_OWNER_ADDRESS_PROVIDED");
    })
})