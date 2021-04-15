import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";

describe("Multisig management", async () => {

    const accounts = waffle.provider.getWallets();

    const deployMultisig = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const multisigDeployment = await deployments.get("WrapMultisig");
        const multisig = await hre.ethers.getContractFactory("WrapMultisig");
        return multisig.attach(multisigDeployment.address);
    })

    it('should add owner with threshold contract', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.addOwnerWithThreshold(accounts[3].address, 3))
            .to.emit(multisig, 'AddedOwner')
            .withArgs(accounts[3].address)
            .to.emit(multisig, 'ChangedThreshold')
            .withArgs(3);
        expect(await multisig.getOwners()).to.deep.equal([accounts[3].address, accounts[0].address, accounts[1].address, accounts[2].address]);
        expect(await multisig.getThreshold()).to.equal(3);
    });

    it('Shouldnt allow to add owner if not admin', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[0]);

        await expect(multisigNotAdmin.addOwnerWithThreshold(accounts[3].address, 3))
            .to.be.revertedWith("WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
    });

    it('should swap owners', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.swapOwner(accounts[1].address, accounts[2].address, accounts[3].address))
            .to.emit(multisig, 'RemovedOwner')
            .withArgs(accounts[2].address)
            .to.emit(multisig, 'AddedOwner')
            .withArgs(accounts[3].address);
        expect(await multisig.getOwners()).to.deep.equal([accounts[0].address, accounts[1].address, accounts[3].address]);
        expect(await multisig.getThreshold()).to.equal(2);
    });

    it('Shouldnt allow to swap owners if not admin', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[0]);

        await expect(multisigNotAdmin.swapOwner(accounts[1].address, accounts[2].address, accounts[3].address))
            .to.be.revertedWith("WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
    });

    it('should change threshold', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.changeThreshold(3))
            .to.emit(multisig, 'ChangedThreshold')
            .withArgs(3);
        expect(await multisig.getThreshold()).to.equal(3);
    });

    it('shouldnt allow to change threshold if not admin', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[0]);

        await expect(multisigNotAdmin.changeThreshold(3))
            .to.be.revertedWith("WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
    });

    it('should remove owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.removeOwner(accounts[1].address, accounts[2].address, 2))
            .to.emit(multisig, 'RemovedOwner')
            .withArgs(accounts[2].address);
        expect(await multisig.getOwners()).to.deep.equal([accounts[0].address, accounts[1].address]);
    });

    it('shouldnt allow to remove owner if not admin', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[0]);

        await expect(multisigNotAdmin.removeOwner(accounts[1].address, accounts[2].address, 2))
            .to.be.revertedWith("WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
    });
})