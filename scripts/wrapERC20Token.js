const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const multisigContract = new web3.eth.Contract(params.wrapABI, params.contractAddress);
            for (let i = 0; i < 3; i++) {
                await multisigContract.methods.wrapERC20(params.erc20Address, web3.utils.toWei((1.12345*(i+1)).toString(), 'ether'), params.tezosDestinationAddress)
                    .send({
                        from: accounts[0],
                        gas: 400000
                    });
            }
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}