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

    it('should add owner with threshold', async () => {
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

    it('should add owner with the same threshold', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.addOwnerWithThreshold(accounts[3].address, 2))
            .to.emit(multisig, 'AddedOwner')
            .withArgs(accounts[3].address)
            .to.not.emit(multisig, 'ChangedThreshold')
            .withArgs(2);
        expect(await multisig.getOwners()).to.deep.equal([accounts[3].address, accounts[0].address, accounts[1].address, accounts[2].address]);
        expect(await multisig.getThreshold()).to.equal(2);
    });

    it('Shouldnt allow to add owner if not admin', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[0]);

        await expect(multisigNotAdmin.addOwnerWithThreshold(accounts[3].address, 3))
            .to.be.revertedWith("WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
    });

    it('Shouldnt allow to add owner with 0 address', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.addOwnerWithThreshold("0x0000000000000000000000000000000000000000", 3))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('Shouldnt allow to add owner with sentinel address', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.addOwnerWithThreshold("0x0000000000000000000000000000000000000001", 3))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('Shouldnt allow to add an existing owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.addOwnerWithThreshold(accounts[0].address, 3))
            .to.be.revertedWith("WRAP: ADDRESS_IS_ALREADY_AN_OWNER");
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

    it('shouldnt allow to swap owners with 0 address', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.swapOwner(accounts[1].address, accounts[2].address, "0x0000000000000000000000000000000000000000"))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('shouldnt allow to swap owners with sentinel address', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.swapOwner(accounts[1].address, accounts[2].address, "0x0000000000000000000000000000000000000001"))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('shouldnt allow to swap owners with an existing owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.swapOwner(accounts[1].address, accounts[2].address, accounts[0].address))
            .to.be.revertedWith("WRAP: ADDRESS_IS_ALREADY_AN_OWNER");
    });

    it('shouldnt allow to swap owners with 0 address as old owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.swapOwner(accounts[1].address, "0x0000000000000000000000000000000000000000", accounts[3].address))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('shouldnt allow to swap owners with sentinel address as old owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.swapOwner(accounts[1].address, "0x0000000000000000000000000000000000000001", accounts[3].address))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('shouldnt allow to swap owners if invalid prev owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.swapOwner(accounts[5].address, accounts[1].address, accounts[3].address))
            .to.be.revertedWith("WRAP: INVALID_PREV_OWNER_OWNER_PAIR_PROVIDED");
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

    it('shouldnt allow to change threshold if more than owners count', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.changeThreshold(4))
            .to.be.revertedWith("WRAP: THRESHOLD_CANNOT_EXCEED_OWNER_COUNT");
    });

    it('shouldnt allow to change threshold to 0', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.changeThreshold(0))
            .to.be.revertedWith("WRAP: THRESHOLD_NEEED_TO_BE_GREETER_THAN_0");
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

    it('should remove owner and change threshold', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);

        await expect(multisig.removeOwner(accounts[1].address, accounts[2].address, 1))
            .to.emit(multisig, 'RemovedOwner')
            .withArgs(accounts[2].address)
            .to.emit(multisig, 'ChangedThreshold')
            .withArgs(1);
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

    it('shouldnt allow to remove owner if threshold too high', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.removeOwner(accounts[1].address, accounts[2].address, 3))
            .to.be.revertedWith("WRAP: NEW_OWNER_COUNT_NEEDS_TO_BE_LONGER_THAN_THRESHOLD");
    });

    it('shouldnt allow to remove owner if 0 address', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.removeOwner(accounts[1].address, "0x0000000000000000000000000000000000000000", 2))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('shouldnt allow to remove owner if sentinel address', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.removeOwner(accounts[1].address, "0x0000000000000000000000000000000000000001", 2))
            .to.be.revertedWith("WRAP: INVALID_OWNER_ADDRESS_PROVIDED");
    });

    it('shouldnt allow to remove owner if invalid prev owner', async () => {
        const contract = await deployMultisig();
        const multisig = contract.connect(accounts[4])
        await multisig.setup([accounts[0].address, accounts[1].address, accounts[2].address], 2);
        const multisigNotAdmin = contract.connect(accounts[4]);

        await expect(multisigNotAdmin.removeOwner(accounts[5].address, accounts[2].address, 2))
            .to.be.revertedWith("WRAP: INVALID_PREV_OWNER_OWNER_PAIR_PROVIDED");
    });
})