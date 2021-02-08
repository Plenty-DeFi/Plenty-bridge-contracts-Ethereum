const {ethSign, checkTxEvent} = require('./utils/helper');

const WrapMultisig = artifacts.require("./WrapMultisig.sol");

contract('Multisig management', (accounts) => {
    let multisig;
    let administrator = accounts[4];

    const createContract = async () => {
        multisig = await WrapMultisig.new(administrator);
        await multisig.setup([accounts[0], accounts[1], accounts[2]], 2, {from: administrator});
    }

    beforeEach(createContract)

    it('Should add owner with threshold contract', async () => {
        const tx = await multisig.addOwnerWithThreshold(accounts[3], 3, {from: administrator});

        assert.equal(checkTxEvent(tx, 'AddedOwner', multisig.address, true).args.owner, accounts[3]);
        assert.equal(checkTxEvent(tx, 'ChangedThreshold', multisig.address, true).args.threshold.toNumber(), 3);
        assert.deepEqual(await multisig.getOwners(), [accounts[3], accounts[0], accounts[1], accounts[2]]);
        assert.equal(await multisig.getThreshold(), 3);
    });

    it('Shouldnt allow to add owner if not admin', async () => {
        try {
            await multisig.addOwnerWithThreshold(accounts[3], 3, {from: accounts[5]});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Should swap owners', async () => {
        const tx = await multisig.swapOwner(accounts[1], accounts[2], accounts[3], {from: administrator});

        assert.equal(checkTxEvent(tx, 'RemovedOwner', multisig.address, true).args.owner, web3.utils.toChecksumAddress(accounts[2]));
        assert.equal(checkTxEvent(tx, 'AddedOwner', multisig.address, true).args.owner, web3.utils.toChecksumAddress(accounts[3]));
        assert.deepEqual(await multisig.getOwners(), [web3.utils.toChecksumAddress(accounts[0]), web3.utils.toChecksumAddress(accounts[1]), web3.utils.toChecksumAddress(accounts[3])]);
        assert.equal(await multisig.getThreshold(), 2);
    });

    it('Shouldnt allow to swap owners if not admin', async () => {
        try {
            await multisig.swapOwner(accounts[1], accounts[2], accounts[3], {from: accounts[5]});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Should change threshold', async () => {
        const tx = await multisig.changeThreshold(3, {from: administrator});

        assert.equal(checkTxEvent(tx, 'ChangedThreshold', multisig.address, true).args.threshold, 3);
    });

    it('Shouldnt allow to change threshold if not admin', async () => {
        try {
            await multisig.changeThreshold(3, {from: accounts[5]});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Should remove owner', async () => {
        const tx = await multisig.removeOwner(accounts[1], accounts[2], 2, {from: administrator});

        assert.equal(checkTxEvent(tx, 'RemovedOwner', multisig.address, true).args.owner, web3.utils.toChecksumAddress(accounts[2]));
    });

    it('Shouldnt allow to remove owner if not admin', async () => {
        try {
            await multisig.removeOwner(accounts[1], accounts[2], 2, {from: accounts[5]});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });
})
