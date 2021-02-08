const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            const data = multisigContract.methods.addOwnerWithThreshold(accounts[5], 2).encodeABI();
            await web3.eth.sendTransaction({
                from: accounts[3],
                to: params.contractAddress,
                value: 0,
                data: data,
                gas: 200000
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}