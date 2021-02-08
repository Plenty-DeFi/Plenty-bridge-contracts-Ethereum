const {ethSign, checkTxEvent, createERC20Contract} = require('./utils/helper');

const WrapMultisig = artifacts.require("./WrapMultisig.sol");

contract('Unwrap erc20', (accounts) => {
    let multisig;
    let testToken;
    let testTokenAddress;

    const signer = async function (confirmingAccounts, to, value, data, tezosTransaction) {
        let txHash = await multisig.getTransactionHash(to, value, data, tezosTransaction)
        let signatureBytes = "0x"
        confirmingAccounts.sort()
        for (var i = 0; i < confirmingAccounts.length; i++) {
            let signature = (await ethSign(confirmingAccounts[i], txHash)).replace('0x', '').replace(/00$/, "1b").replace(/01$/, "1c")
            signatureBytes += signature
        }
        return signatureBytes
    }

    const createContract = async () => {
        multisig = await WrapMultisig.new(accounts[4]);
        await multisig.setup([accounts[0], accounts[1], accounts[2]], 2, {from: accounts[4]});
    }

    const unwrapTransaction = async (to, value, data, tezosTransaction, signers) => {
        let signatures = await signer(signers, to, value, data, tezosTransaction);
        return multisig.execTransaction(
            to, value, data, tezosTransaction, signatures, {
                from: accounts[8],
                gas: 200000
            }
        );
    }

    const validateEvent = (tx, eventName) => {
        checkTxEvent(tx, eventName, multisig.address, true)
    }

    beforeEach(async () => {
        await createContract();
        const erc20 = await createERC20Contract(web3, accounts[0]);
        testTokenAddress = erc20.address;
        testToken = erc20.contract;
    })

    it('Should withdraw ERC20 with 2 signers', async () => {
        await testToken.methods.transfer(multisig.address, 100).send({from: accounts[0]})
        let signers = [accounts[0], accounts[2]]
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        let data = await testToken.methods.transfer(destination, 10).encodeABI();

        const tx = await unwrapTransaction(testTokenAddress, 0, data, "0x1234", signers);

        validateEvent(tx, 'ExecutionSuccess');
        assert.equal(await testToken.methods.balances(multisig.address).call(), 90)
        assert.equal(await testToken.methods.balances(destination).call(), 10)
    });

    it('Should withdraw ERC20 with 3 signers', async () => {
        await testToken.methods.transfer(multisig.address, 100).send({from: accounts[0]})
        let signers = [accounts[0], accounts[1], accounts[2]]
        const destination = "0xA60aea45459B168D833F913D5901AC84D5d554D5";
        let data = await testToken.methods.transfer(destination, 10).encodeABI();

        const tx = await unwrapTransaction(testTokenAddress, 0, data, "0x1234", signers);

        validateEvent(tx, 'ExecutionSuccess');
        assert.equal(await testToken.methods.balances(multisig.address).call(), 90);
        assert.equal(await testToken.methods.balances(destination).call(), 10);
    });

    it('Shouldnt withdraw same tezos transaction twice', async () => {
        await testToken.methods.transfer(multisig.address, 100).send({from: accounts[0]})
        let signers = [accounts[0], accounts[2]]
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        let data = await testToken.methods.transfer(destination, 10).encodeABI();
        await unwrapTransaction(testTokenAddress, 0, data, "1234", signers);

        try {
            await unwrapTransaction(testTokenAddress, 0, data, "1234", signers);
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: TRANSACTION_ALREADY_PROCESSED");
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }
    });

    it('Shouldnt withdraw on threshold not reached', async () => {
        await testToken.methods.transfer(multisig.address, 100).send({from: accounts[0]})
        let signers = [accounts[0]]
        const destination = "0xF3fAa7E80d6F21fBf667d0bC7F74eEd6594Cb1b3";
        let data = await testToken.methods.transfer(destination, 10).encodeABI();

        try {
            await unwrapTransaction(testTokenAddress, 0, data, "1234", signers);
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: SIGNATURES_DATA_TOO_SHORT");
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }
    });

    it('Shouldnt withdraw more than erc20 total balance', async () => {
        await testToken.methods.transfer(multisig.address, 100).send({from: accounts[0]})
        let signers = [accounts[0], accounts[2]]
        const destination = "0x427B055cDDb82e57D03A3a2B00151402cC7b4247";
        let data = await testToken.methods.transfer(destination, 110).encodeABI();

        const tx = await unwrapTransaction(testTokenAddress, 0, data, "1234", signers);

        validateEvent(tx, 'ExecutionFailure');
        assert.equal(await testToken.methods.balances(multisig.address).call(), 100);
        assert.equal(await testToken.methods.balances(destination).call(), 0);
    });

    it('Shouldnt withdraw on bad signers', async () => {
        await testToken.methods.transfer(multisig.address, 100).send({from: accounts[0]})
        let signers = [accounts[0], accounts[3]]
        const destination = "0x7153E54E8ABbf60Bb8ADaff1f91283Ed49d37a56";
        let data = await testToken.methods.transfer(destination, 10).encodeABI();
        let failed;

        try {
            await unwrapTransaction(destination, 0, data, "1234", signers)
        } catch (e) {
            failed = true
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }
    });

    it('Should say if tezos transaction already processed', async () => {
        await testToken.methods.transfer(multisig.address, 100).send({from: accounts[0]})
        let signers = [accounts[0], accounts[2]]
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        let data = await testToken.methods.transfer(destination, 10).encodeABI();
        await unwrapTransaction(testTokenAddress, 0, data, "1234", signers);

        assert.ok(await multisig.isTezosOperationProcessed("1234"));
        assert.ok(!(await multisig.isTezosOperationProcessed("123456")));
    });
})
