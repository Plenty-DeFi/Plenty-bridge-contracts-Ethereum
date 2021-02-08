const WrapMultisig = artifacts.require("./WrapMultisig.sol");

contract('Wrap ethers', (accounts) => {
    let multisig;

    const createContract = async () => {
        multisig = await WrapMultisig.new(accounts[4]);
        await multisig.setup([accounts[0], accounts[1], accounts[2]], 2, {from: accounts[4]});
    }

    beforeEach(createContract)

    it('Cant send any ether to contract', async () => {
        let failed;
        try {
            await web3.eth.sendTransaction({from: accounts[9], to: multisig.address, value: web3.utils.toWei("0.1", 'ether')});
        } catch (e) {
            failed = true;
        } finally {
            assert.ok(failed, "Transaction execution should fail")
        }
    });
});
