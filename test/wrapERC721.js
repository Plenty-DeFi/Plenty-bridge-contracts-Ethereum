const {checkTxEvent, createERC721Contract} = require('./utils/helper');

const WrapMultisig = artifacts.require("./WrapMultisig.sol");

contract('Wrap erc721', (accounts) => {
    let multisig;
    let testToken;
    let testTokenAddress;

    const createContract = async () => {
        multisig = await WrapMultisig.new();
        await multisig.setup(accounts[4], [accounts[0], accounts[1], accounts[2]], 2);
    }

    beforeEach(async () => {
        await createContract();
        const erc721 = await createERC721Contract(web3, accounts[0]);
        testTokenAddress = erc721.address;
        testToken = erc721.contract;
    })

    it('Should ask for wrap', async () => {
        const source = accounts[6];
        await testToken.methods.mint(source, 1337).send({from: accounts[0]});
        await testToken.methods.setApprovalForAll(multisig.address, true).send({from: source});

        const tx = await multisig.wrapERC721(testTokenAddress, 1337, "1234", {from: source});

        const event = checkTxEvent(tx, 'ERC721WrapAsked', multisig.address, true);
        assert.equal(event.args.user, source);
        assert.equal(event.args.tokenId, 1337);
        assert.equal(event.args.token, testTokenAddress);
        assert.equal(event.args.tezosDestinationAddress, "1234");
        assert.equal(await testToken.methods.ownerOf(1337).call(), multisig.address);
        assert.equal(await testToken.methods.balanceOf(multisig.address).call(), 1);
    });

    it('Should fail if not approved', async () => {
        const source = accounts[6];
        await testToken.methods.mint(source, 1337).send({from: accounts[0]});

        try {
            await multisig.wrapERC721(testTokenAddress, 1337, "1234", {from: source});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: ERC721_TRANSFER_FAILED")
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }
    });

    it('Should fail if token id not found', async () => {
        const source = accounts[6];
        await testToken.methods.mint(source, 1337).send({from: accounts[0]});
        await testToken.methods.setApprovalForAll(multisig.address, true).send({from: source});

        try {
            await multisig.wrapERC721(testTokenAddress, 1338, "1234", {from: source});
        } catch (e) {
            failed = true;
            assert.equal(e.reason, "WRAP: ERC721_TRANSFER_FAILED")
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }
    });
});
