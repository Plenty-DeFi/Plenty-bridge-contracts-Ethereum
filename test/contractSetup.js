const WrapMultisig = artifacts.require("./WrapMultisig.sol");

contract('Contract setup management', (accounts) => {
    let multisig;
    let administrator;

    beforeEach(async () => {
        administrator = accounts[4];
        multisig = await WrapMultisig.new(administrator);
    });

    it('Should setup contract administrator', async () => {
        assert.equal(await multisig.getAdministrator(), administrator);
    });

    it('Shouldnt allow to setup contract if not administrator', async () => {
        try {
            await multisig.setup(
                [accounts[0], accounts[2], accounts[2]], 2, {from: accounts[5]}
            );
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: METHOD_CAN_ONLY_BE_CALLED_BY_ADMINISTRATOR");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Should setup contract owners and threshold', async () => {
        let owners = [accounts[0], accounts[1], accounts[2]];
        let threshold = 2;

        await multisig.setup(owners, threshold, {from: administrator});

        assert.deepEqual(await multisig.contract.methods.getOwners().call(), owners);
        assert.ok(await multisig.contract.methods.isOwner(accounts[0]).call());
        assert.ok(await multisig.contract.methods.isOwner(accounts[1]).call());
        assert.ok(await multisig.contract.methods.isOwner(accounts[2]).call());
        assert.ok(!(await multisig.contract.methods.isOwner(accounts[3]).call()));
        assert.equal(await multisig.contract.methods.getThreshold().call(), 2);
    });

    it('Cant setup contract twice', async () => {
        await multisig.setup([accounts[0], accounts[1], accounts[2]], 2, {from: administrator});

        try {
            await multisig.setup([accounts[0], accounts[1], accounts[2]], 2, {from: administrator});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: DOMAIN_SEPARATOR_ALREADY_SET");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Shouldnt allow threshold bigger than owners length', async () => {
        try {
            await multisig.setup(
                [accounts[0], accounts[1], accounts[2]], 4, {from: administrator}
            );
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: THRESHOLD_CANNOT_EXCEED_OWNER_COUNT");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Shouldnt allow a 0 threshold', async () => {
        try {
            await multisig.setup(
                [accounts[0], accounts[1], accounts[2]], 0, {from: administrator}
            );
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: THRESHOLD_NEEED_TO_BE_GREETER_THAN_0");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Shouldnt allow an invalid owner', async () => {
        try {
            await multisig.setup(
                [accounts[0], "0x0000000000000000000000000000000000000000", accounts[2]], 2, {from: administrator}
            );
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: INVALID_OWNER_PROVIDED");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });

    it('Shouldnt allow duplicates owners', async () => {
        try {
            await multisig.setup(
                [accounts[0], accounts[2], accounts[2]], 2, {from: administrator}
            );
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: DUPLICATE_OWNER_ADDRESS_PROVIDED");
        } finally {
            assert.ok(failed, "Transaction execution should fail");
        }
    });
})
