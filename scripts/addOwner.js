const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            await multisigContract.methods.addOwnerWithThreshold(accounts[5], 1).send({
                from: accounts[3],
                gas: 200000
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}