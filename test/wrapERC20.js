const {checkTxEvent, createERC20Contract} = require('./utils/helper');

const WrapMultisig = artifacts.require("./WrapMultisig.sol");

contract('Wrap erc20', (accounts) => {
    let multisig;
    let testToken;
    let testTokenAddress;

    const createContract = async () => {
        multisig = await WrapMultisig.new(accounts[4]);
        await multisig.setup([accounts[0], accounts[1], accounts[2]], 2, {from: accounts[4]});
    }

    beforeEach(async () => {
        await createContract();
        const erc20 = await createERC20Contract(web3, accounts[0]);
        testTokenAddress = erc20.address;
        testToken = erc20.contract;
    })

    it('Should ask for wrap', async () => {
        const source = accounts[6];
        await testToken.methods.transfer(source, 100).send({from: accounts[0]})
        await testToken.methods.approve(multisig.address, 10).send({from: source});

        const tx = await multisig.wrapERC20(testTokenAddress, 10, "1234", {from: source});

        const event = checkTxEvent(tx, 'ERC20WrapAsked', multisig.address, true);
        assert.equal(event.args.amount, 10);
        assert.equal(event.args.token, testTokenAddress);
        assert.equal(event.args.tezosDestinationAddress, "1234");
        assert.equal(await testToken.methods.balances(multisig.address).call(), 10);
        assert.equal(await testToken.methods.balances(source).call(), 90);
    });

    it('Should fail if 0 wrapped', async () => {
        const source = accounts[6];
        await testToken.methods.transfer(source, 100).send({from: accounts[0]});
        await testToken.methods.approve(multisig.address, 10).send({from: source});

        try {
            await multisig.wrapERC20(testTokenAddress, 0, "1234", {from: source});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: INVALID_AMOUNT")
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }

    });

    it('Should fail if not approved', async () => {
        const source = accounts[6];
        await testToken.methods.transfer(source, 100).send({from: accounts[0]})

        try {
            await multisig.wrapERC20(testTokenAddress, 10, "1234", {from: source});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: ERC20_TRANSFER_FAILED")
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }

    });
});
