const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            const erc721Contract = new web3.eth.Contract(params.erc721ABI, params.erc721Address);
            const mintData = erc721Contract.methods.mint(accounts[0], params.erc721TokenId).encodeABI();
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: params.erc721Address,
                value: 0,
                data: mintData
            });
            const approveData = erc721Contract.methods.setApprovalForAll(params.contractAddress, true).encodeABI();
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: params.erc721Address,
                value: 0,
                data: approveData
            });
            const data = multisigContract.methods.wrapERC721(params.erc721Address, params.erc721TokenId, params.tezosDestinationAddress).encodeABI();
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: params.contractAddress,
                value: 0,
                data: data,
                gas: 400000
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}