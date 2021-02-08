const allParams = require('./params');

module.exports = function(callback) {
    (async () => {
        try {
            const params = allParams(await web3.eth.net.getNetworkType());
            const accounts = await web3.eth.getAccounts();
            const erc20Contract = new web3.eth.Contract(params.erc20ABI, params.erc20Address);
            const data = erc20Contract.methods.approve(params.contractAddress, web3.utils.toWei("100", 'ether')).encodeABI();
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: params.erc20Address,
                value: 0,
                data
            });
        } catch (e) {
            console.log(e);
        }
        console.log("done");
        callback();
    })();
}