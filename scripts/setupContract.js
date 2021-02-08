const configuration = require('../configuration');
const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const network = await web3.eth.net.getNetworkType();
            const params = allParams(network);
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            const data = multisigContract.methods.setup([accounts[0], accounts[1], accounts[2]], 2).encodeABI();
            await web3.eth.sendTransaction({
                from: configuration.administrator(accounts)[network],
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