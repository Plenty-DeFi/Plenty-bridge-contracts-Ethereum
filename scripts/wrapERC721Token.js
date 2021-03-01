const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            const erc721Contract = new web3.eth.Contract(params.erc721ABI, params.erc721Address);
            await erc721Contract.methods.mint(accounts[0], params.erc721TokenId).send({
                from: accounts[0]
            });
            await erc721Contract.methods.setApprovalForAll(params.contractAddress, true).send({
                from: accounts[0]
            });
            await multisigContract.methods.wrapERC721(params.erc721Address, params.erc721TokenId, params.tezosDestinationAddress).send({
                from: accounts[0],
                gas: 400000
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}