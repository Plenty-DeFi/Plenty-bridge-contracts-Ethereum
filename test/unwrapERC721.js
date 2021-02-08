const {ethSign, checkTxEvent, createERC721Contract} = require('./utils/helper');

const WrapMultisig = artifacts.require("./WrapMultisig.sol");

contract('Unwrap erc721', (accounts) => {
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
        const erc721 = await createERC721Contract(web3, accounts[0]);
        testTokenAddress = erc721.address;
        testToken = erc721.contract;
    })

    it('Should withdraw ERC721 with 2 signers', async () => {
        await testToken.methods.mint(multisig.address, 1337).send({from: accounts[0]});
        let signers = [accounts[0], accounts[2]];
        const destination = "0x95ADDFfF52B727E0d2317a2f1f255350f743813E";
        let data = await testToken.methods.safeTransferFrom(multisig.address, destination, 1337).encodeABI();

        const tx = await unwrapTransaction(testTokenAddress, 0, data, "0x1234", signers);

        validateEvent(tx, 'ExecutionSuccess');
        assert.equal(await testToken.methods.ownerOf(1337).call(), destination);
        assert.equal(await testToken.methods.balanceOf(multisig.address).call(), 0);
    });
})
